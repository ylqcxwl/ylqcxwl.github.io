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

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const term = query.value.trim();

    if (!term) {
      query.focus();
      return;
    }

    if (engine.value !== "site") {
      const engines = {
        baidu: "https://www.baidu.com/s?wd=",
        bilibili: "https://search.bilibili.com/all?keyword=",
        github: "https://github.com/search?q=",
        bing: "https://www.bing.com/search?q=",
        google: "https://www.google.com/search?q=",
      };
      const base = engines[engine.value] || engines.bing;
      window.open(base + encodeURIComponent(term), "_blank", "noopener");
      return;
    }

    const needle = term.toLocaleLowerCase("zh-CN");
    clearHits();
    const cards = Array.from(
      document.querySelectorAll(".tile, .link-list a, .tool-card, .app-card")
    );
    const hits = cards.filter((card) => {
      const text = `${card.textContent} ${card.dataset.keywords || ""}`;
      return text.toLocaleLowerCase("zh-CN").includes(needle);
    });

    if (!hits.length) {
      status.textContent = "本站没有匹配内容，可以试试百度、B站、GitHub 等搜索引擎。";
      return;
    }

    hits.forEach((card) => card.classList.add("search-hit"));
    const preferred = hits.find((card) => {
      const view = card.closest(".view");
      return view && view.dataset.view !== "home";
    }) || hits[0];
    const firstView = preferred.closest(".view");
    const target = firstView ? firstView.dataset.view : "home";
    goTo(target, true);
    const label = navItems.find((item) => item.dataset.view === target)?.textContent.trim() || target;
    status.textContent = `找到 ${hits.length} 个结果，已跳转到「${label}」并高亮。`;
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
