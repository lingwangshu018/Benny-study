// Benny Study · 左侧导航交互 v0.4
(function () {
  const icons = {
    "首页": "🏠",
    "完整课程库": "📚",
    "每日执行计划": "🗓️",
    "今日任务": "📋",
    "错题库": "🌷",
    "学习进度": "📊",
    "每周复盘": "📝",
    "考试中心": "🎯",
    "番茄钟": "🍅",
    "行测训练": "✏️"
  };

  function decorateNav() {
    document.querySelectorAll(".nav-button").forEach(button => {
      const label = button.textContent.trim();
      button.dataset.icon = icons[label] || "·";
    });
  }

  function installMobileMenu() {
    const topbar = document.querySelector(".topbar");
    const brand = document.querySelector(".brand");
    if (!topbar || !brand || topbar.querySelector(".sidebar-menu-button")) return;

    const button = document.createElement("button");
    button.className = "sidebar-menu-button";
    button.type = "button";
    button.setAttribute("aria-label", "打开导航菜单");
    button.setAttribute("aria-expanded", "false");
    button.textContent = "☰";
    brand.insertAdjacentElement("afterend", button);

    button.addEventListener("click", () => {
      const open = topbar.classList.toggle("nav-open");
      button.textContent = open ? "✕" : "☰";
      button.setAttribute("aria-expanded", String(open));
    });

    topbar.addEventListener("click", event => {
      if (!event.target.closest(".nav-button")) return;
      topbar.classList.remove("nav-open");
      button.textContent = "☰";
      button.setAttribute("aria-expanded", "false");
    });
  }

  function initSidebar() {
    decorateNav();
    installMobileMenu();
  }

  const observer = new MutationObserver(() => decorateNav());
  document.addEventListener("DOMContentLoaded", () => {
    initSidebar();
    const nav = document.getElementById("mainNav");
    if (nav) observer.observe(nav, { childList: true, subtree: true });
  });
})();
