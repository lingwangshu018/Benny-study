// Benny Study · Illustration Integration v2
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
    pomodoroComplete: "assets/illustrations/pomodoro/pomodoro-complete-card.png"
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

  function decorateCourses() {
    const hero = document.querySelector(".courses-hero");
    setCover(hero, ASSETS.courses, "courses-cover-hero", "兔兔和小狮子来到知识花园课程库");
    hero?.querySelector(".courses-hero-art")?.setAttribute("aria-hidden", "true");
  }

  function decorateToday() {
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

  function decorateTraining() {
    const summary = document.querySelector(".training-summary");
    insertBanner(
      summary,
      "trainingHallIllustration",
      ASSETS.training,
      "兔兔和小狮子在魔法训练大厅进行计算、推理和资料分析训练",
      "能力训练大厅 · 每一次练习都在给思维升级"
    );
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

  function decorateWeekly() {
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

  function decorate() {
    decorateCourses();
    decorateToday();
    decoratePlan();
    decorateErrors();
    decorateTraining();
    decoratePomodoro();
    decorateHomePomodoro();
    decorateExamCountdown();
    decorateProgress();
    decorateWeekly();
    decorateExams();
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