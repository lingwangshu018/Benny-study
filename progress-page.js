// Benny Study · 学习统计中心 v0.2
(function () {
  function toISO(value) {
    return String(value || "").slice(0, 10);
  }
  function startOfWeekISO() {
    const d = new Date();
    const weekday = d.getDay() || 7;
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - weekday + 1);
    return dateISO(d);
  }
  function fmtMinutes(total) {
    total = Math.max(0, Math.round(Number(total) || 0));
    const h = Math.floor(total / 60), m = total % 60;
    return h ? `${h}小时${m ? m + "分" : ""}` : `${m}分钟`;
  }
  function focusMinutesBetween(start, end) {
    return (state.focusSessions || [])
      .filter(x => x.status === "completed")
      .filter(x => { const d = toISO(x.endedAt || x.date); return d >= start && d <= end; })
      .reduce((sum, x) => sum + Number(x.actualMinutes || x.plannedMinutes || 0), 0);
  }
  function dateRange7() {
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      out.push(dateISO(d));
    }
    return out;
  }
  function completedOn(date) {
    return state.courses.filter(c => c.done && toISO(c.doneDate || c.completedDate || c.finishDate || c.planDate) === date).length;
  }
  function errorsOn(date) {
    return state.errors.filter(e => toISO(e.date || e.createdAt) === date).length;
  }
  function completedPlanTasksOn(date) {
    const day = state.plan.find(x => x.date === date);
    return day ? (day.tasks || []).filter(x => x.done).length : 0;
  }
  function sevenDayChart() {
    const days = dateRange7();
    const values = days.map(d => focusMinutesBetween(d, d));
    const max = Math.max(60, ...values);
    return `<div class="stats-bars">${days.map((d, i) => {
      const h = Math.max(8, Math.round(values[i] / max * 100));
      const label = new Date(`${d}T00:00:00`).toLocaleDateString("zh-CN", { weekday: "short" });
      return `<div class="stats-bar-item"><span>${fmtMinutes(values[i])}</span><div class="stats-bar-track"><i style="height:${h}%"></i></div><small>${label}</small></div>`;
    }).join("")}</div>`;
  }
  function phaseCards() {
    return PHASES.map(phase => {
      const all = state.courses.filter(c => c.phase === phase).length;
      const done = state.courses.filter(c => c.phase === phase && c.done).length;
      const pct = all ? Math.round(done / all * 100) : 0;
      return `<article class="stats-phase-card"><div class="stats-phase-head"><span>${phase}</span><b>${pct}%</b></div><div class="stats-phase-track"><i style="width:${pct}%"></i></div><small>${done} / ${all} 项已完成</small></article>`;
    }).join("");
  }
  function moduleRows() {
    const modules = [...new Set(state.courses.map(c => c.module).filter(Boolean))];
    return modules.map(module => {
      const all = state.courses.filter(c => c.module === module).length;
      const done = state.courses.filter(c => c.module === module && c.done).length;
      const pct = all ? Math.round(done / all * 100) : 0;
      return `<div class="stats-module-row"><span>${esc(module)}</span><div class="stats-module-track"><i style="width:${pct}%"></i></div><b>${pct}%</b></div>`;
    }).join("") || `<div class="stats-empty">导入课程后，这里会显示各模块进度。</div>`;
  }

  window.renderProgress = function renderProgress() {
    const today = dateISO(new Date());
    const weekStart = startOfWeekISO();
    const total = state.courses.length;
    const done = state.courses.filter(c => c.done).length;
    const overallPct = total ? Math.round(done / total * 100) : 0;
    const todayFocus = focusMinutesBetween(today, today);
    const weekFocus = focusMinutesBetween(weekStart, today);
    const todayErrors = errorsOn(today);
    const mastered = state.errors.filter(e => e.status === "已掌握").length;
    const todayTasks = completedPlanTasksOn(today);
    const todayPlan = state.plan.find(x => x.date === today);
    const todayTotal = todayPlan ? (todayPlan.tasks || []).length : 0;
    const todayPct = todayTotal ? Math.round(todayTasks / todayTotal * 100) : 0;

    return `${sectionHead("学习进度", "把课程、专注、错题和每日完成情况汇总在一起。")}
      <section class="stats-page">
        <div class="stats-summary-grid">
          <article class="stats-summary-card blue"><span>总体课程进度</span><strong>${overallPct}%</strong><small>${done} / ${total} 项完成</small></article>
          <article class="stats-summary-card pink"><span>今日任务完成</span><strong>${todayPct}%</strong><small>${todayTasks} / ${todayTotal} 项完成</small></article>
          <article class="stats-summary-card yellow"><span>今日专注</span><strong>${fmtMinutes(todayFocus)}</strong><small>本周 ${fmtMinutes(weekFocus)}</small></article>
          <article class="stats-summary-card green"><span>错题掌握</span><strong>${mastered}</strong><small>今日新增 ${todayErrors} 道</small></article>
        </div>

        <div class="stats-main-grid">
          <article class="stats-panel stats-trend-panel">
            <header><div><h3>最近 7 天专注趋势</h3><p>只统计已完成的专注记录。</p></div><button class="secondary" type="button" onclick="navigate('pomodoro')">去专注 ›</button></header>
            ${sevenDayChart()}
          </article>
          <article class="stats-panel stats-overall-panel">
            <header><div><h3>总体完成率</h3><p>所有阶段课程的综合进度。</p></div></header>
            <div class="stats-ring" style="--stats-value:${overallPct}"><div><strong>${overallPct}%</strong><span>已完成</span></div></div>
            <p>${total ? `还剩 ${Math.max(0, total - done)} 项课程/资源。` : "导入课程后开始统计。"}</p>
          </article>
        </div>

        <section class="stats-panel">
          <header><div><h3>四阶段进度</h3><p>基础轮、题海轮、突破轮和模拟轮严格分开统计。</p></div></header>
          <div class="stats-phase-grid">${phaseCards()}</div>
        </section>

        <section class="stats-panel">
          <header><div><h3>模块完成情况</h3><p>帮助你快速看出哪一块推进得快、哪一块还需要补。</p></div></header>
          <div class="stats-module-list">${moduleRows()}</div>
        </section>
      </section>`;
  };
})();
