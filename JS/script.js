(() => {
  "use strict";

  const views = Array.from(document.querySelectorAll(".view"));
  const navItems = Array.from(document.querySelectorAll(".nav-item"));
  const validViews = views.map((view) => view.dataset.view);
  let activeView = "home";

  function clearHits() {
    document.querySelectorAll(".search-hit").forEach((el) => {
      el.classList.remove("search-hit");
    });
    const results = document.getElementById("search-results");
    if (results) {
      results.textContent = "";
      results.hidden = true;
    }
    const tiles = document.querySelector(".tiles");
    if (tiles) tiles.hidden = false;
  }

  function showView(name, updateHash = false) {
    if (!validViews.includes(name)) {
      name = "home";
    }

    activeView = name;
    views.forEach((view) => {
      const isActive = view.dataset.view === name;
      view.hidden = !isActive;
      view.classList.toggle("is-active", isActive);
    });

    navItems.forEach((item) => {
      const isActive = item.dataset.view === name;
      item.classList.toggle("is-active", isActive);
      if (isActive) {
        item.setAttribute("aria-current", "page");
      } else {
        item.removeAttribute("aria-current");
      }
    });

    if (updateHash && location.hash !== `#${name}`) {
      history.pushState(null, "", `#${name}`);
    }
  }

  function goTo(name, keepHits = false) {
    if (!keepHits) clearHits();
    if (validViews.includes(name)) {
      showView(name, true);
    }
  }

  navItems.forEach((item) => {
    item.addEventListener("click", () => goTo(item.dataset.view));
  });

  document.querySelectorAll("[data-go]").forEach((button) => {
    button.addEventListener("click", () => goTo(button.dataset.go));
  });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const name = link.getAttribute("href").slice(1);
      if (!validViews.includes(name)) return;
      event.preventDefault();
      goTo(name);
    });
  });

  window.addEventListener("hashchange", () => {
    clearHits();
    showView(location.hash.slice(1));
  });

  const form = document.getElementById("site-search");
  const query = document.getElementById("search-query");
  const engine = document.getElementById("search-engine");
  const status = document.getElementById("search-status");
  const results = document.getElementById("search-results");
  const menu = document.getElementById("engine-menu");
  const engineToggle = document.getElementById("engine-toggle");
  const badge = document.getElementById("search-engine-badge");
  const tiles = document.querySelector(".tiles");
  const engines = {
    baidu: "https://www.baidu.com/s?wd=%s",
    bing: "https://www.bing.com/search?q=%s",
    google: "https://www.google.com/search?q=%s",
    github: "https://github.com/search?q=%s",
    bilibili: "https://search.bilibili.com/all?keyword=%s",
  };

  function closeMenu() {
    menu.hidden = true;
    engineToggle.setAttribute("aria-expanded", "false");
  }

  function syncEngineUI() {
    const chip = menu.querySelector(`.engine-chip[data-engine="${engine.value}"]`);
    const img = chip?.querySelector(".engine-ico-img");
    badge.textContent = "";
    if (img) {
      const badgeImg = document.createElement("img");
      badgeImg.className = "engine-badge-img";
      badgeImg.src = img.getAttribute("src");
      badgeImg.alt = "";
      badge.appendChild(badgeImg);
      badge.style.background = "#fff";
    } else {
      const icon = chip?.querySelector(".engine-ico");
      badge.textContent = icon?.textContent || "站";
      badge.style.background = icon ? getComputedStyle(icon).color : "var(--accent)";
    }
    menu.querySelectorAll(".engine-chip").forEach((item) => {
      item.classList.toggle("is-active", item.dataset.engine === engine.value);
    });
  }

  engineToggle.addEventListener("click", () => {
    const open = menu.hidden;
    menu.hidden = !open;
    engineToggle.setAttribute("aria-expanded", String(open));
  });

  engineToggle.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      engineToggle.click();
    }
  });

  menu.addEventListener("click", (event) => {
    const chip = event.target.closest(".engine-chip");
    if (!chip) return;
    engine.value = chip.dataset.engine;
    syncEngineUI();
    closeMenu();
    query.focus();
  });

  document.addEventListener("click", (event) => {
    if (!engineToggle.contains(event.target) && !menu.contains(event.target)) closeMenu();
  });

  engine.addEventListener("change", () => {
    syncEngineUI();
    if (engine.value === "site") runSiteSearch();
    else clearHits();
  });
  syncEngineUI();

  function runSiteSearch() {
    const term = query.value.trim();
    clearHits();
    if (!term) {
      status.textContent = "";
      return;
    }

    const needle = term.toLocaleLowerCase("zh-CN");
    const cards = Array.from(
      document.querySelectorAll(".link-list a, .tool-card, .app-card")
    );
    const hits = cards.filter((card) => {
      const text = `${card.textContent} ${card.dataset.keywords || ""}`;
      return text.toLocaleLowerCase("zh-CN").includes(needle);
    });

    if (!hits.length) {
      status.textContent = "本站没有匹配内容，可以试试百度、B站、GitHub 等搜索引擎。";
      return;
    }

    status.textContent = `找到 ${hits.length} 个结果，显示在下方。`;
    results.hidden = false;
    tiles.hidden = true;

    hits.forEach((card) => {
      const view = card.closest(".view");
      const viewName = view ? view.dataset.view : "home";
      const label = navItems.find((item) => item.dataset.view === viewName)?.textContent.trim() || "首页";
      const title = card.querySelector("strong")?.textContent.trim() || card.textContent.trim().slice(0, 24);
      const descEl = card.querySelector("small") || (card.matches(".link-list a") ? card.querySelector("span") : null);
      const desc = descEl?.textContent.trim() || "";
      const href = card.getAttribute("href");

      const item = document.createElement("a");
      item.className = "result-card";
      if (href && href.startsWith("#")) {
        item.href = href;
        item.addEventListener("click", (event) => {
          event.preventDefault();
          goTo(href.slice(1));
        });
      } else if (href) {
        item.href = href;
        if (card.target) item.target = card.target;
        if (card.rel) item.rel = card.rel;
      } else {
        item.href = `#${viewName}`;
        item.addEventListener("click", (event) => {
          event.preventDefault();
          goTo(viewName);
        });
      }

      const icon = document.createElement("span");
      icon.className = "result-icon";
      const initial = title.charAt(0) || "结";
      const sourceIcon = card.querySelector(".tool-icon") || card.querySelector(".engine-ico-img");
      let iconSrc = "";
      if (href && /github\.com/i.test(href)) {
        iconSrc = "imgs/engines/github.png";
      } else {
        iconSrc = sourceIcon?.getAttribute("src") || "";
      }
      if (!iconSrc && href && /^https?:\/\//i.test(href)) {
        iconSrc = faviconFor(href);
      }
      if (!iconSrc) iconSrc = "favicon.ico";
      if (iconSrc) {
        const img = document.createElement("img");
        img.className = "result-icon-img";
        img.src = iconSrc;
        img.alt = "";
        img.addEventListener("error", () => {
          icon.textContent = initial;
        });
        icon.appendChild(img);
      } else {
        icon.textContent = initial;
      }

      const text = document.createElement("span");
      text.className = "result-text";
      const strong = document.createElement("strong");
      strong.textContent = title;
      const small = document.createElement("small");
      small.textContent = [label, desc].filter(Boolean).join(" · ");
      text.append(strong, small);

      item.append(icon, text);
      results.appendChild(item);
    });
  }

  query.addEventListener("input", () => {
    if (engine.value === "site") runSiteSearch();
    else clearHits();
  });

  query.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const term = query.value.trim();

    if (!term) {
      query.focus();
      return;
    }

    if (engine.value !== "site") {
      const base = engines[engine.value] || engines.bing;
      window.open(base.replace("%s", encodeURIComponent(term)), "_blank", "noopener");
      return;
    }

    runSiteSearch();
  });

  function faviconFor(url) {
    try {
      const parsed = new URL(url, location.href);
      if (parsed.host === location.host) return "";
      return `${parsed.origin}/favicon.ico`;
    } catch (_) {
      return "";
    }
  }

  function renderTools() {
    const grid = document.getElementById("tools-grid");
    const empty = document.getElementById("tools-empty");
    if (!grid) return;

    const data = Array.isArray(window.TOOLS_DATA) ? window.TOOLS_DATA : [];
    grid.textContent = "";
    empty.hidden = data.length > 0;

    data.forEach((item) => {
      if (!item || !item.name || !item.url) return;
      const external = /^https?:\/\//i.test(item.url);
      const card = document.createElement("a");
      card.className = "tool-card";
      card.href = item.url;
      card.target = "_blank";
      card.rel = "noopener noreferrer";

      const wrap = document.createElement("span");
      wrap.className = "tool-icon-wrap";

      const fallback = document.createElement("span");
      fallback.className = "tool-fallback";
      fallback.textContent = item.name.trim().charAt(0) || "工";
      wrap.appendChild(fallback);

      const iconUrl = item.icon || faviconFor(item.url);
      if (iconUrl) {
        const img = document.createElement("img");
        img.className = "tool-icon";
        img.src = iconUrl;
        img.alt = "";
        img.loading = "lazy";
        img.decoding = "async";
        img.addEventListener("load", () => {
          img.classList.add("is-loaded");
          fallback.style.visibility = "hidden";
        });
        img.addEventListener("error", () => img.remove());
        wrap.appendChild(img);
      }

      const text = document.createElement("span");
      const title = document.createElement("strong");
      title.textContent = item.name;
      const desc = document.createElement("small");
      desc.textContent = item.desc || (external ? new URL(item.url).hostname : "本地工具");
      text.append(title, desc);

      card.append(wrap, text);
      grid.appendChild(card);
    });
  }

  renderTools();
  showView(location.hash.slice(1) || activeView);
})();
