(() => {
  "use strict";

  const views = Array.from(document.querySelectorAll(".view"));
  const navItems = Array.from(document.querySelectorAll(".nav-item"));
  const validViews = views.map((view) => view.dataset.view);
  let activeView = "home";

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

  function goTo(name) {
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
    showView(location.hash.slice(1));
  });

  const form = document.getElementById("site-search");
  const query = document.getElementById("search-query");
  const engine = document.getElementById("search-engine");
  const status = document.getElementById("search-status");
  const tiles = Array.from(document.querySelectorAll(".tile"));

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
    let found = 0;
    tiles.forEach((tile) => {
      const text = `${tile.textContent} ${tile.dataset.keywords || ""}`;
      const matched = text.toLocaleLowerCase("zh-CN").includes(needle);
      tile.hidden = !matched;
      if (matched) found += 1;
    });

    goTo("home");
    status.textContent = found
      ? `找到 ${found} 个与本页相关的内容。`
      : "本页没有匹配内容，可以试试 Bing 或 Google。";
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
