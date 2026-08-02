// Benny Study · final illustration integration v4
(function () {
  const ASSETS = {
    coursesStats: "assets/illustrations/courses/courses-stats-strip.png",
    coursesFilter: "assets/illustrations/courses/courses-filter-panel.png",

    planHeader: "assets/illustrations/plans/weekly-plan-header.png",
    planStart: "assets/illustrations/plans/weekly-day-start-card.png",
    planMiddle: "assets/illustrations/plans/weekly-day-middle-card.png",
    planWeekend: "assets/illustrations/plans/weekly-day-weekend-card.png",

    progressStats: "assets/illustrations/progress/progress-stats-strip.png",
    progressTrend: "assets/illustrations/progress/progress-focus-trend-panel.png",
    progressOverall: "assets/illustrations/progress/progress-overall-panel.png",
    progressStages: "assets/illustrations/progress/progress-four-stages-panel.png",
    progressModules: "assets/illustrations/progress/progress-modules-panel.png",

    examDetail: "assets/illustrations/exams/exam-detail-hero.png",
    examAdjustment: "assets/illustrations/exams/exam-adjustment-panel.png",

    pomodoroStats: "assets/illustrations/pomodoro/pomodoro-stats-strip.png",
    pomodoroHistory: "assets/illustrations/pomodoro/pomodoro-history-panel.png",

    sidebarAvatar: "assets/illustrations/ui/sidebar-avatar.png",
    sidebarDesktop: "assets/illustrations/ui/sidebar-bottom-decor.png",
    sidebarMobile: "assets/illustrations/ui/sidebar-avatar-duo-draft.png"
  };

  function addClasses(element, classNames) {
    if (!element) return;
    String(classNames || "").split(/\s+/).filter(Boolean).forEach(name => element.classList.add(name));
  }

  function applyArtwork(element, src, classNames, label) {
    if (!element) return;
    addClasses(element, `v4-art-cover ${classNames || ""}`);
    element.style.setProperty("--v4-art", `url("${src}")`);
    element.dataset.v4Artwork = src;
    if (label) element.setAttribute("aria-label", label);
  }

  function findByHeading(selector, text) {
    return [...document.querySelectorAll(selector)].find(element =>
      element.querySelector("h1,h2,h3,h4,strong")?.textContent?.trim().includes(text)
    );
  }

  function decorateCourses() {
    document.querySelectorAll(".courses-stats .course-stat").forEach((card, index) => {
      applyArtwork(card, ASSETS.coursesStats, `courses-stat-art courses-stat-art-${index + 1}`, "课程统计插画");
    });
    applyArtwork(
      document.querySelector(".courses-toolbar"),
      ASSETS.coursesFilter,
      "courses-filter-art",
      "兔兔和小狮子整理课程分类"
    );
  }

  function decoratePlan() {
    applyArtwork(
      document.querySelector(".plan-page-hero"),
      ASSETS.planHeader,
      "plan-header-art",
      "兔兔和小狮子展开本周学习路线"
    );

    document.querySelectorAll(".plan-week-card").forEach((card, index) => {
      if (index <= 1) {
        applyArtwork(card, ASSETS.planStart, "plan-day-art plan-day-start-art", "一周前段学习计划");
      } else if (index <= 4) {
        applyArtwork(card, ASSETS.planMiddle, "plan-day-art plan-day-middle-art", "一周中段学习计划");
      } else {
        applyArtwork(card, ASSETS.planWeekend, "plan-day-art plan-day-weekend-art", "周末复习与整理计划");
      }
    });
  }

  function decorateProgress() {
    document.querySelectorAll(".stats-summary-grid .stats-summary-card").forEach((card, index) => {
      applyArtwork(card, ASSETS.progressStats, `progress-stat-art progress-stat-art-${index + 1}`, "学习进度统计插画");
    });

    applyArtwork(
      document.querySelector(".stats-trend-panel"),
      ASSETS.progressTrend,
      "progress-trend-art",
      "兔兔和小狮子沿着七日专注星光路线前进"
    );
    applyArtwork(
      document.querySelector(".stats-overall-panel"),
      ASSETS.progressOverall,
      "progress-overall-art",
      "兔兔和小狮子望向成长城堡"
    );

    const stages = findByHeading(".stats-page > .stats-panel", "四阶段进度");
    const modules = findByHeading(".stats-page > .stats-panel", "模块完成情况");
    applyArtwork(stages, ASSETS.progressStages, "progress-stages-art", "四阶段成长花园");
    applyArtwork(modules, ASSETS.progressModules, "progress-modules-art", "学习模块成长花园");
  }

  function decorateExams() {
    document.querySelectorAll(".exam-card").forEach(card => {
      applyArtwork(card, ASSETS.examDetail, "exam-detail-art", "兔兔和小狮子走向考试城堡");
      const fields = card.querySelector(".exam-fields");
      applyArtwork(fields, ASSETS.examAdjustment, "exam-adjustment-art", "兔兔和小狮子整理考试复盘与调整");
    });
  }

  function decoratePomodoro() {
    document.querySelectorAll(".focus-summary .focus-stat").forEach((card, index) => {
      applyArtwork(card, ASSETS.pomodoroStats, `pomodoro-stat-art pomodoro-stat-art-${index + 1}`, "专注统计插画");
    });
    applyArtwork(
      document.querySelector(".focus-history-card"),
      ASSETS.pomodoroHistory,
      "pomodoro-history-art",
      "兔兔和小狮子整理专注记录"
    );
  }

  function ensureSidebarArtwork() {
    const brandMark = document.querySelector(".brand-mark");
    if (brandMark && !brandMark.querySelector("img.sidebar-avatar-image")) {
      brandMark.innerHTML = `<img class="sidebar-avatar-image" src="${ASSETS.sidebarAvatar}" alt="Benny Study 小兔头像">`;
      brandMark.classList.add("sidebar-avatar-ready");
    }

    const topbar = document.querySelector(".topbar");
    const actions = document.querySelector(".top-actions");
    if (topbar && actions && !topbar.querySelector(".sidebar-desktop-decor")) {
      const decor = document.createElement("div");
      decor.className = "sidebar-desktop-decor";
      decor.setAttribute("aria-hidden", "true");
      decor.style.setProperty("--sidebar-desktop-art", `url("${ASSETS.sidebarDesktop}")`);
      actions.insertAdjacentElement("beforebegin", decor);
    }

    const nav = document.querySelector(".main-nav");
    if (nav && !nav.querySelector(".sidebar-mobile-decor")) {
      const mobileDecor = document.createElement("div");
      mobileDecor.className = "sidebar-mobile-decor";
      mobileDecor.setAttribute("aria-hidden", "true");
      mobileDecor.style.setProperty("--sidebar-mobile-art", `url("${ASSETS.sidebarMobile}")`);
      nav.appendChild(mobileDecor);
    }
  }

  function decorateAll() {
    decorateCourses();
    decoratePlan();
    decorateProgress();
    decorateExams();
    decoratePomodoro();
    ensureSidebarArtwork();
  }

  let queued = false;
  function scheduleDecorate() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      decorateAll();
    });
  }

  const app = document.getElementById("app");
  if (app) new MutationObserver(scheduleDecorate).observe(app, { childList: true, subtree: true });

  const nav = document.getElementById("mainNav");
  if (nav) new MutationObserver(scheduleDecorate).observe(nav, { childList: true, subtree: true });

  window.addEventListener("hashchange", scheduleDecorate);
  document.addEventListener("DOMContentLoaded", scheduleDecorate);
  scheduleDecorate();
})();
