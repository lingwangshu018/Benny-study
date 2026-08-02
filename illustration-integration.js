// Benny Study · Illustration Integration v1
(function () {
  const ASSETS = {
    errors: "assets/illustrations/errors/errors-garden-main.png",
    training: "assets/illustrations/training/training-hall-main.png",
    pomodoroFocus: "assets/illustrations/pomodoro/pomodoro-focus-night.png",
    pomodoroBreak: "assets/illustrations/pomodoro/pomodoro-break.png",
    pomodoroComplete: "assets/illustrations/pomodoro/pomodoro-complete.png",
    progress: "assets/illustrations/progress/progress-growth-record.png",
    weekly: "assets/illustrations/weekly/weekly-review.png",
    exams: "assets/illustrations/exams/exam-center-castle.png"
  };

  function artImage(src, alt, className = "") {
    return `<img class="${className}" src="${src}" alt="${alt}" loading="lazy" decoding="async">`;
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

  function latestFocusWasJustCompleted() {
    const latest = Array.isArray(state?.focusSessions) ? state.focusSessions.at(-1) : null;
    if (!latest || latest.status !== "completed" || !latest.endedAt) return false;
    const ended = new Date(latest.endedAt).getTime();
    return Number.isFinite(ended) && Date.now() - ended < 120000 && !timer?.running && timer?.mode === "focus" && timer?.remaining === timer?.total;
  }

  function pomodoroScene() {
    if (timer?.mode !== "focus") {
      return {
        src: ASSETS.pomodoroBreak,
        alt: "兔兔坐在舒适沙发上喝水休息",
        text: "休息一下，喝口水再回来"
      };
    }
    if (latestFocusWasJustCompleted()) {
      return {
        src: ASSETS.pomodoroComplete,
        alt: "兔兔举起奖杯庆祝完成一轮专注",
        text: "这一轮完成啦，做得很好"
      };
    }
    return {
      src: ASSETS.pomodoroFocus,
      alt: "月光下兔兔和小狮子在书桌前认真学习",
      text: "安静专注，慢慢走完这一小段路"
    };
  }

  function decoratePomodoro() {
    const card = document.querySelector(".focus-timer-card");
    if (!card) return;
    const scene = pomodoroScene();
    let host = card.querySelector(".focus-illustration");
    if (!host) {
      host = document.createElement("div");
      host.className = "focus-illustration";
      const tabs = card.querySelector(".focus-mode-tabs");
      tabs?.insertAdjacentElement("afterend", host);
    }
    const current = host.querySelector("img")?.getAttribute("src");
    if (current !== scene.src) {
      host.innerHTML = `${artImage(scene.src, scene.alt, "focus-illustration-image")}<span>${scene.text}</span>`;
    } else {
      const caption = host.querySelector("span");
      if (caption) caption.textContent = scene.text;
    }
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
    const first = document.querySelector(".review-page > :first-child");
    insertBanner(
      first,
      "weeklyIllustration",
      ASSETS.weekly,
      "兔兔在温暖书桌前写每周复盘，小狮子陪伴整理成长记录",
      "每周复盘 · 写下进步，也温柔地调整方向"
    );
  }

  function decorateExams() {
    const host = document.querySelector(".exam-hero-mark");
    if (!host || host.dataset.illustrationReady) return;
    host.dataset.illustrationReady = "true";
    host.innerHTML = artImage(ASSETS.exams, "兔兔和小狮子沿着花路走向考试城堡", "exam-hero-image");
  }

  function decorate() {
    decorateErrors();
    decorateTraining();
    decoratePomodoro();
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