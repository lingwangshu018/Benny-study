// Benny Study · 今日任务页 v0.1
(function () {
  function getTodayPlan() {
    const today = dateISO(new Date());
    return state.plan.find(x => x.date === today) || state.plan.find(x => !x.completed) || state.plan[0];
  }

  function formatMinutes(task) {
    if (task.type !== "video") return "刷题";
    return `${Math.round((task.minutes || 0) / 2)} 分钟`;
  }

  function taskItem(task) {
    return `<label class="today-task-item">
      <input class="plan-task-check" data-id="${esc(taskId(task))}" type="checkbox" ${task.done ? "checked" : ""}>
      <span class="today-task-copy"><strong>${esc(task.module || task.phase || "学习任务")}</strong><small>${esc(task.chapter || "")} · ${esc(task.name || "")}</small></span>
      <span class="today-task-time">${formatMinutes(task)}</span>
    </label>`;
  }

  function taskColumn(kind, title, icon, tasks) {
    return `<article class="today-column ${kind}">
      <header class="today-column-head"><div><span class="today-column-icon">${icon}</span><h2>${title}</h2></div><small>${tasks.length} 项</small></header>
      ${tasks.length ? `<div class="today-task-list">${tasks.map(taskItem).join("")}</div>` : `<div class="today-empty-slot">这一时段暂时没有任务，可以用来补漏或休息一下。</div>`}
    </article>`;
  }

  function eveningColumn(day) {
    return `<article class="today-column evening">
      <header class="today-column-head"><div><span class="today-column-icon">🌙</span><h2>晚上 · 只做错题</h2></div><small>不安排新课</small></header>
      <div class="evening-note">
        <div class="moon">🌙</div>
        <h3>把今天遇到的问题收好</h3>
        <p>晚上不再塞新知识，只把白天学到的内容整理清楚，让错误真正变成进步。</p>
        <div class="evening-checklist"><span>✓ 写清错误原因</span><span>✓ 记录正确方法</span><span>✓ 标注下次复习日期</span></div>
      </div>
      <div class="evening-actions">
        <button class="today-main-action add-error-from-day" data-date="${day?.date || dateISO(new Date())}" type="button">🌷 记录今天的错题</button>
        <button class="today-sub-action" type="button" onclick="navigate('errors')">打开错题花园</button>
      </div>
    </article>`;
  }

  renderToday = function renderToday() {
    const day = getTodayPlan();
    if (!day) return `${sectionHead("今日任务", "今天的任务还没有生成。", `<button class="primary" onclick="navigate('courses')">导入课程</button>`)}${empty("先导入 Excel 并自动排课，哥哥就会把今天安排好。")}`;

    const morning = (day.tasks || []).filter(x => x.slot === "morning");
    const afternoon = (day.tasks || []).filter(x => x.slot === "afternoon");
    const all = day.tasks || [];
    const done = all.filter(x => x.done).length;
    const pct = all.length ? Math.round(done / all.length * 100) : 0;
    const videoHours = Number(day.videoHours || 0).toFixed(1);

    return `<section class="today-page-shell">
      <div class="today-page-hero">
        <div class="today-page-title"><span>🐰 今日学习作战卡</span><h1>${day.date} · ${esc(day.phase)}</h1><p>今天不用一下子完成所有事情，只要从第一项开始，稳稳往前走。</p></div>
        <div class="today-summary"><div><b>${done}/${all.length}</b><small>已完成</small></div><div><b>${pct}%</b><small>今日进度</small></div><div><b>${videoHours}h</b><small>预计课程</small></div></div>
      </div>
      <div class="today-grid">
        ${taskColumn("morning", "上午 · 核心学习", "☀️", morning)}
        ${taskColumn("afternoon", "下午 · 继续推进", "🌤", afternoon)}
        ${eveningColumn(day)}
      </div>
      <div class="today-progress-card">
        <div class="today-progress-ring" style="--pct:${pct}"><b>${pct}%</b></div>
        <div class="today-progress-copy"><h3>${pct === 100 ? "今天完成啦！" : "今天也在认真前进"}</h3><p>${pct === 100 ? "辛苦啦，接下来只需要好好休息。" : `还剩 ${Math.max(0, all.length - done)} 项，慢慢来就好。`}</p></div>
        <div class="today-progress-actions"><button class="today-sub-action" type="button" onclick="navigate('plan')">查看完整计划</button><button class="today-main-action" type="button" onclick="navigate('pomodoro')">🍅 开始专注</button></div>
      </div>
    </section>`;
  };

  document.addEventListener("DOMContentLoaded", () => {
    if ((location.hash.replace("#", "") || "home") === "today") render();
  });
})();
