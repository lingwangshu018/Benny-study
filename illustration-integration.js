// Benny Study · Illustration Integration v3
(function () {
  const ASSETS = {
    errors: "assets/illustrations/errors/errors-garden-main.png",
    training: "assets/illustrations/training/training-hall-main.png",
    progress: "assets/illustrations/progress/progress-growth-record.png",

    courses: "assets/illustrations/courses/courses-library-banner.png",
    today: "assets/illustrations/today/today-battle-card-banner.png",
    plan: "assets/illustrations/plans/weekly-execution-banner.png",
    weekly: "assets/illustrations/weekly/weekly-review-banner.png",
    exams: "assets/illustrations/exams/exam-center-banner.png",
    examCountdown: "assets/illustrations/exams/exam-countdown-card.png",

    pomodoroFocus: "assets/illustrations/pomodoro/pomodoro-focus-card.png",
    pomodoroBreak: "assets/illustrations/pomodoro/pomodoro-break-card.png",
    pomodoroComplete: "assets/illustrations/pomodoro/pomodoro-complete-card.png",

    homeTasks: "assets/illustrations/home/home-tasks-panel.png",
    homeProgress: "assets/illustrations/home/home-progress-panel.png",
    homeErrors: "assets/illustrations/home/home-errors-panel.png",
    homeWeekly: "assets/illustrations/home/home-weekly-panel.png",

    todayMorning: "assets/illustrations/today/today-morning-card.png",
    todayAfternoon: "assets/illustrations/today/today-afternoon-card.png",
    todayEvening: "assets/illustrations/today/today-evening-errors-card.png",

    weeklyModules: "assets/illustrations/weekly/weekly-modules-panel.png",
    weeklySummary: "assets/illustrations/weekly/weekly-summary-panel.png",

    trainingArithmetic: "assets/illustrations/training/training-arithmetic-card.png",
    trainingReasoning: "assets/illustrations/training/training-number-reasoning-card.png",
    trainingThinking: "assets/illustrations/training/training-thinking-card.png",
    trainingData: "assets/illustrations/training/training-data-analysis-card.png",
    trainingHistoryEmpty: "assets/illustrations/training/training-history-empty.png"
  };

  function artImage(src, alt, className = "") {
    return `<img class="${className}" src="${src}" alt="${alt}" loading="lazy" decoding="async">`;
  }

  function setCover(host, src, className, label) {
    if (!host) return;
    host.classList.add("illustration-cover", className);
    host.style.setProperty("--illustration-image", `url("${src}")`);
    host.dataset.illustrationSrc = src;
    if (label) host.dataset.illustrationLabel = label;
  }

  function setPanelCover(host, src, className, label) {
    if (!host) return;
    host.classList.add("panel-illustration-cover", className);
    host.style.setProperty("--panel-image", `url("${src}")`);
    host.dataset.panelIllustrationSrc = src;
    if (label) host.dataset.panelIllustrationLabel = label;
  }

  function findPanelByHeading(selector, heading) {
    return [...document.querySelectorAll(selector)].find(panel =>
      panel.querySelector("header strong, header h2, header h3")?.textContent?.trim().includes(heading)
    );
  }

  function decorateCourses() {
    const hero = document.querySelector(".courses-hero");
    setCover(hero, ASSETS.courses, "courses-cover-hero", "兔兔和小狮子来到知识花园课程库");
    hero?.querySelector(".courses-hero-art")?.setAttribute("aria-hidden", "true");
  }

  function decorateTodayHero() {
    setCover(
      document.querySelector(".today-page-hero"),
      ASSETS.today,
      "today-cover-hero",
      "兔兔和小狮子一起开始今天的学习任务"
    );
  }

  function decoratePlan() {
    setCover(
      document.querySelector(".plan-page-hero"),
      ASSETS.plan,
      "plan-cover-hero",
      "兔兔和小狮子沿着一周计划路线稳步前进"
    );
  }

  function decorateErrors() {
    const host = document.querySelector(".errors-hero-art");
    if (!host || host.dataset.illustrationReady) return;
    host.dataset.illustrationReady = "true";
    host.innerHTML = artImage(ASSETS.errors, "兔兔和小狮子在错题花园里浇灌知识花朵", "errors-hero-image");
  }

  function insertBanner(beforeNode, id, src, alt, label) {
    if (!beforeNode || document.getElementById(id)) return;
    const figure = document.createElement("figure");
    figure.id = id;
    figure.className = "page-illustration-banner";
    figure.innerHTML = `${artImage(src, alt, "page-illustration-image")}<figcaption>${label}</figcaption>`;
    beforeNode.parentElement?.insertBefore(figure, beforeNode);
  }

  function decorateProgress() {
    const first = document.querySelector(".stats-page > :first-child");
    insertBanner(
      first,
      "progressIllustration",
      ASSETS.progress,
      "兔兔和小狮子一起查看学习进度与成长记录",
      "成长记录室 · 让每一点进步都有迹可循"
    );
  }

  function decorateWeeklyHero() {
    document.getElementById("weeklyIllustration")?.remove();
    setCover(
      document.querySelector(".review-week-title"),
      ASSETS.weekly,
      "weekly-cover-hero",
      "兔兔写每周复盘，小狮子陪着整理成长记录"
    );
  }

  function decorateExams() {
    const hero = document.querySelector(".exam-hero");
    setCover(hero, ASSETS.exams, "exam-cover-hero", "兔兔和小狮子沿着花路走向考试城堡");
    const oldHost = hero?.querySelector(".exam-hero-mark");
    if (oldHost) {
      oldHost.innerHTML = "";
      oldHost.setAttribute("aria-hidden", "true");
    }
  }

  function latestFocusWasJustCompleted() {
    const rows = Array.isArray(state?.focusSessions) ? state.focusSessions : [];
    const latest = rows[rows.length - 1];
    if (!latest || latest.status !== "completed" || !latest.endedAt) return false;
    const ended = new Date(latest.endedAt).getTime();
    return Number.isFinite(ended)
      && Date.now() - ended < 120000
      && !timer?.running
      && timer?.mode === "focus"
      && timer?.remaining === timer?.total;
  }

  function pomodoroScene() {
    if (timer?.mode !== "focus") {
      return {
        key: "break",
        src: ASSETS.pomodoroBreak,
        alt: "兔兔喝水休息，小狮子安心打盹",
        text: "休息一下，喝口水再回来"
      };
    }
    if (latestFocusWasJustCompleted()) {
      return {
        key: "complete",
        src: ASSETS.pomodoroComplete,
        alt: "兔兔和小狮子庆祝完成一轮专注",
        text: "这一轮完成啦，做得很好"
      };
    }
    return {
      key: "focus",
      src: ASSETS.pomodoroFocus,
      alt: "月光下兔兔和小狮子在书桌前专注学习",
      text: "安静专注，慢慢走完这一小段路"
    };
  }

  function applyPomodoroScene(host, scene, home = false) {
    if (!host) return;
    host.classList.add(home ? "home-pomodoro-cover" : "focus-card-cover");
    host.classList.remove("scene-focus", "scene-break", "scene-complete");
    host.classList.add(`scene-${scene.key}`);
    host.style.setProperty(home ? "--home-pomodoro-image" : "--focus-card-image", `url("${scene.src}")`);
    host.dataset.scene = scene.key;
    host.dataset.sceneLabel = scene.text;
  }

  function decoratePomodoro() {
    const card = document.querySelector(".focus-timer-card");
    if (!card) return;
    card.querySelector(".focus-illustration")?.remove();
    applyPomodoroScene(card, pomodoroScene());
  }

  function decorateHomePomodoro() {
    const card = document.querySelector(".home-pomodoro-card");
    applyPomodoroScene(card, pomodoroScene(), true);
    card?.querySelector(".dashboard-pomodoro-art")?.setAttribute("aria-hidden", "true");
  }

  function decorateExamCountdown() {
    const card = document.querySelector(".exam-mini-panel");
    if (!card) return;
    card.classList.add("exam-countdown-cover");
    card.style.setProperty("--exam-countdown-image", `url("${ASSETS.examCountdown}")`);
    card.querySelector(".exam-mini-castle")?.setAttribute("aria-hidden", "true");
  }

  function decorateShortcuts() {
    const shortcutAssets = {
      today: ASSETS.today,
      courses: ASSETS.courses,
      pomodoro: pomodoroScene().src,
      errors: ASSETS.errors,
      exams: ASSETS.exams
    };
    Object.entries(shortcutAssets).forEach(([name, src]) => {
      setPanelCover(
        document.querySelector(`.home-shortcut.${name}`),
        src,
        `shortcut-illustrated shortcut-${name}-illustrated`,
        `${name} 快捷入口插画`
      );
    });
  }

  function decorateHomePanels() {
    setPanelCover(
      document.querySelector(".home-tasks-card"),
      ASSETS.homeTasks,
      "home-tasks-panel-cover",
      "兔兔和小狮子整理今日任务"
    );
    setPanelCover(
      document.querySelector(".home-progress-card"),
      ASSETS.homeProgress,
      "home-progress-panel-cover",
      "兔兔和小狮子仰望成长知识树"
    );
    setPanelCover(
      findPanelByHeading(".home-secondary-grid .home-mini-panel", "错题本"),
      ASSETS.homeErrors,
      "home-errors-panel-cover",
      "兔兔和小狮子整理错题本"
    );
    setPanelCover(
      findPanelByHeading(".home-secondary-grid .home-mini-panel", "近期复盘"),
      ASSETS.homeWeekly,
      "home-weekly-panel-cover",
      "兔兔和小狮子翻看近期复盘"
    );
  }

  function decorateTodayColumns() {
    setPanelCover(
      document.querySelector(".today-column.morning"),
      ASSETS.todayMorning,
      "today-morning-panel-cover today-period-panel-cover",
      "清晨兔兔和小狮子开始核心学习"
    );
    setPanelCover(
      document.querySelector(".today-column.afternoon"),
      ASSETS.todayAfternoon,
      "today-afternoon-panel-cover today-period-panel-cover",
      "午后兔兔和小狮子继续推进学习"
    );
    setPanelCover(
      document.querySelector(".today-column.evening"),
      ASSETS.todayEvening,
      "today-evening-panel-cover today-period-panel-cover",
      "夜晚兔兔和小狮子整理错题"
    );
  }

  function decorateWeeklyPanels() {
    const cards = document.querySelectorAll(".review-grid .review-card");
    setPanelCover(
      cards[0],
      ASSETS.weeklyModules,
      "weekly-modules-panel-cover weekly-detail-panel-cover",
      "兔兔和小狮子检查本周模块花圃"
    );
    setPanelCover(
      cards[1],
      ASSETS.weeklySummary,
      "weekly-summary-panel-cover weekly-detail-panel-cover",
      "兔兔和小狮子一起整理本周小结"
    );
  }

  function decorateTrainingPanels() {
    document.getElementById("trainingHallIllustration")?.remove();
    setPanelCover(
      document.querySelector(".training-summary"),
      ASSETS.training,
      "training-summary-panel-cover",
      "兔兔与小狮子的训练大厅总览"
    );

    const zones = {
      arithmetic: [ASSETS.trainingArithmetic, "计算能力训练"],
      reasoning: [ASSETS.trainingReasoning, "数字推理训练"],
      thinking: [ASSETS.trainingThinking, "思维能力训练"],
      data: [ASSETS.trainingData, "资料分析专项训练"]
    };
    Object.entries(zones).forEach(([name, [src, label]]) => {
      setPanelCover(
        document.querySelector(`.training-zone.${name}`),
        src,
        `training-zone-panel-cover training-zone-${name}-cover`,
        label
      );
    });

    const historyCard = document.querySelector(".training-history-card");
    if (historyCard?.querySelector(".training-empty")) {
      setPanelCover(
        historyCard,
        ASSETS.trainingHistoryEmpty,
        "training-history-empty-cover",
        "兔兔和小狮子等待开启第一轮训练"
      );
    }
  }

  function decorate() {
    decorateCourses();
    decorateTodayHero();
    decoratePlan();
    decorateErrors();
    decoratePomodoro();
    decorateHomePomodoro();
    decorateExamCountdown();
    decorateProgress();
    decorateWeeklyHero();
    decorateExams();

    decorateShortcuts();
    decorateHomePanels();
    decorateTodayColumns();
    decorateWeeklyPanels();
    decorateTrainingPanels();
  }

  let scheduled = false;
  function scheduleDecorate() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      decorate();
    });
  }

  const app = document.getElementById("app");
  if (app) new MutationObserver(scheduleDecorate).observe(app, { childList: true, subtree: true });
  window.addEventListener("hashchange", scheduleDecorate);
  document.addEventListener("DOMContentLoaded", scheduleDecorate);
  scheduleDecorate();
})();