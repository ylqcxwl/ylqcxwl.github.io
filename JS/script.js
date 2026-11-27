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
      const base = engine.value === "bing"
        ? "https://www.bing.com/search?q="
        : "https://www.google.com/search?q=";
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

  showView(location.hash.slice(1) || activeView);
})();
