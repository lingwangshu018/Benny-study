// Benny Study · 首页今日任务/进度/番茄钟面板 v0.3
(function () {
  function todayItem() {
    const todayISO = dateISO(new Date());
    return state.plan.find(x => x.date === todayISO) || state.plan.find(x => !x.completed) || state.plan[0];
  }

  function taskPreview(day) {
    if (!day) return `<div class="dashboard-empty">还没有今日任务，先导入 Excel 并自动排课吧。</div>`;
    const tasks = day.tasks || [];
    const visible = tasks.slice(0, 5);
    return `<div class="dashboard-task-list">
      ${visible.map(task => {
        const id = esc(taskId(task));
        return `<label class="dashboard-task-row">
          <input class="plan-task-check" data-id="${id}" type="checkbox" ${task.done ? "checked" : ""}>
          <span class="dashboard-task-dot"></span>
          <span class="dashboard-task-copy"><strong>${esc(task.module || task.phase || "今日任务")}</strong><small>${esc(task.chapter || "")} · ${esc(task.name || "")}</small></span>
          <span class="dashboard-task-time">${task.type === "video" ? `${Math.round((task.minutes || 0) / 2)} 分钟` : "刷题"}</span>
        </label>`;
      }).join("")}
      ${tasks.length > visible.length ? `<button class="dashboard-more" type="button" onclick="navigate('today')">还有 ${tasks.length - visible.length} 项，查看全部 ›</button>` : ""}
    </div>`;
  }

  function progressPanel() {
    const total = state.courses.length;
    const done = state.courses.filter(c => c.done).length;
    const pct = total ? Math.round(done / total * 100) : 0;
    const phaseRows = PHASES.map(phase => {
      const all = state.courses.filter(c => c.phase === phase).length;
      const phaseDone = completedCourses(phase);
      const phasePct = all ? Math.round(phaseDone / all * 100) : 0;
      return `<div class="dashboard-progress-row">
        <span>${phase}</span>
        <div class="dashboard-progress-track"><i style="width:${phasePct}%"></i></div>
        <b>${phasePct}%</b>
      </div>`;
    }).join("");
    return `<div class="dashboard-progress-layout">
      <div class="dashboard-progress-ring" style="--value:${pct}"><div><b>${pct}%</b><small>总进度</small></div></div>
      <div class="dashboard-progress-bars">${phaseRows}</div>
    </div>`;
  }

  function miniPomodoro() {
    const minutes = String(Math.floor(timer.remaining / 60)).padStart(2, "0");
    const seconds = String(timer.remaining % 60).padStart(2, "0");
    return `<div class="dashboard-pomodoro">
      <div class="dashboard-pomodoro-art">🐰🍅</div>
      <span class="dashboard-pomodoro-label">先专注一小会儿</span>
      <strong>${minutes}:${seconds}</strong>
      <p>今天已完成 ${timer.sessions || 0} 轮番茄钟</p>
      <button class="dashboard-pomodoro-button" type="button" onclick="navigate('pomodoro')">▶ 开始专注</button>
    </div>`;
  }

  function secondaryOverview() {
    const newestErrors = state.errors.slice(-3).reverse();
    const latestWeeks = state.weekly.slice(-3).reverse();
    const exam = nextExam();
    const days = Math.max(0, daysUntil(exam.date));
    return `<section class="home-secondary-grid">
      <article class="home-mini-panel">
        <header><div><span>📘</span><strong>错题本</strong></div><button type="button" onclick="navigate('errors')">查看全部 ›</button></header>
        ${newestErrors.length ? newestErrors.map(e => `<div class="mini-list-row"><span>${esc(e.subject || "错题")}</span><small>${esc(e.chapter || e.type || "待复习")}</small></div>`).join("") : `<div class="mini-empty">今天还没有新增错题 🌱</div>`}
      </article>
      <article class="home-mini-panel">
        <header><div><span>🗓️</span><strong>近期复盘</strong></div><button type="button" onclick="navigate('weekly')">查看全部 ›</button></header>
        ${latestWeeks.length ? latestWeeks.map(w => `<div class="mini-list-row"><span>${esc(w.week || w.title || "周复盘")}</span><small>${esc(w.range || w.date || "")}</small></div>`).join("") : `<div class="mini-empty">完成一周后，这里会留下复盘记录。</div>`}
      </article>
      <article class="home-mini-panel exam-mini-panel">
        <header><div><span>🎯</span><strong>考试倒计时</strong></div><button type="button" onclick="navigate('exams')">全部考试 ›</button></header>
        <div class="exam-mini-main"><div><small>${esc(exam.name)}</small><strong>${days}<em>天</em></strong><span>${exam.date}</span></div><div class="exam-mini-castle">🏰🐰</div></div>
      </article>
    </section>`;
  }

  renderHome = function renderHome() {
    const today = todayItem();
    const todayDone = today ? today.tasks.filter(x => x.done).length : 0;
    const todayTotal = today ? today.tasks.length : 0;
    return `${hero()}
      ${typeof shortcutCards === "function" ? shortcutCards() : ""}
      <section class="home-dashboard-grid">
        <article class="home-dashboard-card home-tasks-card">
          <header class="home-dashboard-head"><div><span class="home-dashboard-icon">📋</span><div><h2>今日任务</h2><p>${today ? `${today.date} · ${today.phase}` : "今天的学习安排"}</p></div></div><span class="home-dashboard-count">${todayDone}/${todayTotal}</span></header>
          ${taskPreview(today)}
        </article>
        <article class="home-dashboard-card home-progress-card">
          <header class="home-dashboard-head"><div><span class="home-dashboard-icon">📊</span><div><h2>学习进度</h2><p>每一步都算数。</p></div></div><button type="button" onclick="navigate('progress')">查看详情 ›</button></header>
          ${progressPanel()}
        </article>
        <article class="home-dashboard-card home-pomodoro-card">
          <header class="home-dashboard-head"><div><span class="home-dashboard-icon">🍅</span><div><h2>番茄钟</h2><p>专注一轮，再休息一下。</p></div></div></header>
          ${miniPomodoro()}
        </article>
      </section>
      ${secondaryOverview()}`;
  };

  document.addEventListener("DOMContentLoaded", () => {
    if ((location.hash.replace("#", "") || "home") === "home") render();
  });
})();
