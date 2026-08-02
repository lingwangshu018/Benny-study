// Benny Study · 每日执行计划页 v0.1
(function () {
  let planWeekOffset = 0;

  function weekStart(date) {
    const d = new Date(`${date}T00:00:00`);
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    return dateISO(d);
  }

  function currentWeekAnchor() {
    const today = dateISO(new Date());
    const base = weekStart(today);
    return addDays(base, planWeekOffset * 7);
  }

  function dayLabel(date) {
    const d = new Date(`${date}T00:00:00`);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  }

  function weekday(date) {
    return ["周日","周一","周二","周三","周四","周五","周六"][new Date(`${date}T00:00:00`).getDay()];
  }

  function planDayCard(day) {
    const tasks = day.tasks || [];
    const done = tasks.filter(x => x.done).length;
    const pct = tasks.length ? Math.round(done / tasks.length * 100) : 0;
    const morning = tasks.filter(x => x.slot === "morning");
    const afternoon = tasks.filter(x => x.slot === "afternoon");
    const list = items => items.length ? items.slice(0, 3).map(t => `<li>${esc(t.module || "课程")} · ${esc(t.name || t.chapter || "任务")}</li>`).join("") : `<li class="plan-muted">机动练习 / 补漏</li>`;
    return `<article class="plan-week-card ${day.date === dateISO(new Date()) ? "is-today" : ""}">
      <header>
        <div><span class="plan-weekday">${weekday(day.date)}</span><strong>${dayLabel(day.date)}</strong></div>
        <span class="badge" style="background:${phaseColor(day.phase)}">${esc(day.phase)}</span>
      </header>
      <div class="plan-day-progress"><span><i style="width:${pct}%"></i></span><b>${done}/${tasks.length}</b></div>
      <section><h4>☀️ 上午</h4><ul>${list(morning)}</ul></section>
      <section><h4>🌤 下午</h4><ul>${list(afternoon)}</ul></section>
      <section class="plan-night"><h4>🌙 晚上</h4><p>只整理错题、总结方法和安排复习。</p></section>
      <footer><span>约 ${(Number(day.videoHours || 0)).toFixed(1)} 小时课程</span><button type="button" onclick="navigate('today')">打开当天任务 ›</button></footer>
    </article>`;
  }

  window.renderPlan = function renderPlan() {
    const start = currentWeekAnchor();
    const end = addDays(start, 6);
    const days = state.plan.filter(x => x.date >= start && x.date <= end);
    const weekTasks = days.flatMap(x => x.tasks || []);
    const done = weekTasks.filter(x => x.done).length;
    const pct = weekTasks.length ? Math.round(done / weekTasks.length * 100) : 0;
    const phaseNames = [...new Set(days.map(x => x.phase))].join(" · ") || "暂无阶段";

    return `<section class="plan-page-shell">
      <header class="plan-page-hero">
        <div><span class="badge">📅 每日执行计划</span><h1>${dayLabel(start)} — ${dayLabel(end)}</h1><p>${phaseNames} · 晚上固定只做错题，不安排新课。</p></div>
        <div class="plan-week-summary"><strong>${pct}%</strong><span>本周完成率</span><small>${done} / ${weekTasks.length} 项</small></div>
      </header>
      <div class="plan-week-toolbar">
        <button class="secondary" id="prevPlanWeek" type="button">← 上一周</button>
        <button class="secondary" id="currentPlanWeek" type="button">回到本周</button>
        <button class="secondary" id="nextPlanWeek" type="button">下一周 →</button>
        <button class="primary" id="autoSchedule" type="button">重新排课</button>
      </div>
      ${days.length ? `<div class="plan-week-grid">${days.map(planDayCard).join("")}</div>` : `<div class="empty">这一周还没有计划。先导入 Excel 并自动排课吧。</div>`}
    </section>`;
  };

  const originalBind = window.bindPageEvents;
  window.bindPageEvents = function bindPageEventsPatched() {
    if (typeof originalBind === "function") originalBind();
    document.getElementById("prevPlanWeek")?.addEventListener("click", () => { planWeekOffset -= 1; render(); });
    document.getElementById("nextPlanWeek")?.addEventListener("click", () => { planWeekOffset += 1; render(); });
    document.getElementById("currentPlanWeek")?.addEventListener("click", () => { planWeekOffset = 0; render(); });
  };
})();
