// Benny Study · 首页快捷入口 v0.2
(function () {
  function shortcutCards() {
    const todayISO = dateISO(new Date());
    const today = state.plan.find(x => x.date === todayISO) || state.plan.find(x => !x.completed);
    const todayDone = today ? today.tasks.filter(t => t.done).length : 0;
    const todayTotal = today ? today.tasks.length : 0;
    const remaining = Math.max(0, state.courses.length - state.courses.filter(c => c.done).length);
    const mastered = state.errors.filter(x => x.status === "已掌握").length;
    const exam = nextExam();
    const days = Math.max(0, daysUntil(exam.date));

    const cards = [
      {
        page: "today", cls: "today", icon: "📋", title: "今日任务",
        text: today ? `${todayDone} / ${todayTotal} 项已完成` : "查看今天的学习安排"
      },
      {
        page: "courses", cls: "courses", icon: "📚", title: "完整课程库",
        text: state.courses.length ? `还剩 ${remaining} 项课程` : "导入 Excel 后自动排课"
      },
      {
        page: "pomodoro", cls: "pomodoro", icon: "🍅", title: "番茄钟",
        text: timer.sessions ? `今天已专注 ${timer.sessions} 轮` : "开始今天第一轮专注"
      },
      {
        page: "errors", cls: "errors", icon: "🌷", title: "错题花园",
        text: state.errors.length ? `${state.errors.length} 道错题 · 掌握 ${mastered} 道` : "每改正一道，就开一朵花"
      },
      {
        page: "exams", cls: "exams", icon: "🎯", title: "考试中心",
        text: `距离${exam.name}还有 ${days} 天`
      }
    ];

    return `<section class="home-shortcuts" aria-label="首页快捷入口">
      ${cards.map(card => `<button class="home-shortcut ${card.cls}" type="button" onclick="navigate('${card.page}')">
        <span class="shortcut-icon">${card.icon}</span>
        <span class="shortcut-copy"><strong>${card.title}</strong><small>${card.text}</small></span>
        <span class="shortcut-arrow">›</span>
      </button>`).join("")}
    </section>`;
  }

  window.shortcutCards = shortcutCards;

  renderHome = function renderHome() {
    const total = state.courses.length;
    const done = state.courses.filter(c => c.done).length;
    const today = state.plan.find(x => x.date === dateISO(new Date()));
    return `${hero()}
      ${shortcutCards()}
      <section class="section">
        <div class="home-overview-title"><div><h2>学习阶段</h2><p>一点一点，把每一轮稳稳走完。</p></div></div>
        <div class="grid grid-4">${PHASES.map(p => {
          const all = state.courses.filter(c => c.phase === p).length;
          const d = completedCourses(p);
          const pct = all ? Math.round(d / all * 100) : 0;
          return `<div class="card"><span class="badge" style="background:${phaseColor(p)}">${p}</span><div class="metric">${d} / ${all}</div><div class="progress"><i style="width:${pct}%"></i></div><p>${pct}% 已完成</p></div>`;
        }).join("")}</div>
      </section>
      <section class="section">${sectionHead("今天的作战卡", today ? `${today.date} · ${today.phase}` : "还没有生成今日任务", `<button class="primary" id="goToday">打开今日任务</button>`)}${today ? dayCard(today, true) : empty("先到“完整课程库”导入 Excel，再点击自动排课。")}</section>
      <section class="section"><div class="grid grid-3"><div class="card"><h3>📚 总课程</h3><div class="metric">${total}</div><p>完成 ${done} 项，剩余 ${Math.max(0,total-done)} 项。</p></div><div class="card"><h3>🌷 错题花园</h3><div class="metric">${state.errors.length}</div><p>已掌握 ${state.errors.filter(x=>x.status==='已掌握').length} 道。</p></div><div class="card"><h3>⏱ 专注次数</h3><div class="metric">${timer.sessions}</div><p>今天完成的番茄钟。</p></div></div></section>`;
  };

  document.addEventListener("DOMContentLoaded", () => {
    if ((location.hash.replace("#", "") || "home") === "home") render();
  });
})();
