// Benny Study · 自动周复盘与考试中心 v0.2
(function () {
  state.weekly ||= [];
  state.examNotes ||= {};

  function mondayOf(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay() || 7;
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - day + 1);
    return d;
  }
  function iso(d) { return dateISO(d); }
  function weekRange(offset = 0) {
    const start = mondayOf();
    start.setDate(start.getDate() + offset * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return { start: iso(start), end: iso(end) };
  }
  let reviewWeekOffset = 0;

  function minutesLabel(total) {
    const n = Math.round(Number(total || 0));
    const h = Math.floor(n / 60), m = n % 60;
    return h ? `${h} 小时${m ? ` ${m} 分` : ""}` : `${m} 分钟`;
  }
  function inRange(value, start, end) {
    const date = String(value || "").slice(0, 10);
    return date >= start && date <= end;
  }
  function weekStats(start, end) {
    const days = state.plan.filter(x => x.date >= start && x.date <= end);
    const tasks = days.flatMap(x => x.tasks || []);
    const done = tasks.filter(x => x.done).length;
    const focus = (state.focusSessions || []).filter(x => x.status === "completed" && inRange(x.endedAt || x.date, start, end));
    const focusMinutes = focus.reduce((sum, x) => sum + Number(x.actualMinutes || 0), 0);
    const errors = (state.errors || []).filter(x => inRange(x.createdAt || x.date, start, end));
    const mastered = (state.errors || []).filter(x => x.status === "已掌握" && inRange(x.lastReviewedAt || x.updatedAt || x.reviewDate || x.date, start, end));
    const moduleMap = {};
    tasks.forEach(t => {
      const key = t.module || "未分类";
      moduleMap[key] ||= { total: 0, done: 0 };
      moduleMap[key].total++;
      if (t.done) moduleMap[key].done++;
    });
    const modules = Object.entries(moduleMap).map(([name, value]) => ({ name, ...value, pct: value.total ? Math.round(value.done / value.total * 100) : 0 }));
    const strongest = [...modules].sort((a,b)=>b.pct-a.pct || b.done-a.done)[0];
    const weakest = [...modules].filter(x=>x.total>0).sort((a,b)=>a.pct-b.pct || b.total-a.total)[0];
    return { days, tasks, done, total: tasks.length, completion: tasks.length ? Math.round(done / tasks.length * 100) : 0, focus, focusMinutes, errors, mastered, modules, strongest, weakest };
  }
  function savedReview(start) {
    return state.weekly.find(x => x.weekStart === start) || {};
  }
  function recommendation(stats) {
    if (!stats.total && !stats.focusMinutes && !stats.errors.length) return "这一周还没有形成足够的数据，先完成几项任务和一轮专注，复盘会自动丰富起来。";
    if (stats.completion < 70) return "下周先减少并行任务，优先完成当天最重要的课程；未完成内容只顺延一次，避免持续堆积。";
    if (stats.weakest && stats.weakest.pct < 70) return `下周给「${stats.weakest.name}」增加固定训练时段，并把相关错题安排两次回看。`;
    if (stats.focusMinutes < 300) return "任务完成情况不错，下周可以用番茄钟补足真实专注时长，让学习记录更准确。";
    return "本周节奏比较稳定。下周保持现有强度，把新增错题按 3 天、7 天两个节点复习。";
  }

  window.renderWeekly = function renderWeekly() {
    const range = weekRange(reviewWeekOffset);
    const stats = weekStats(range.start, range.end);
    const saved = savedReview(range.start);
    const moduleRows = stats.modules.length ? stats.modules.sort((a,b)=>b.total-a.total).map(x => `<div class="review-module-row"><span>${esc(x.name)}</span><div><i style="width:${x.pct}%"></i></div><b>${x.done}/${x.total}</b></div>`).join("") : `<div class="review-empty">本周还没有课程任务数据。</div>`;
    return `${sectionHead("每周复盘", "课程、专注和错题会自动汇总；你只需要写下感受与调整。", `<div class="review-nav"><button class="secondary" id="reviewPrev">← 上一周</button><button class="secondary" id="reviewCurrent">本周</button><button class="secondary" id="reviewNext">下一周 →</button></div>`)}
      <section class="review-page">
        <div class="review-week-title"><div><span>📅</span><div><strong>${range.start} ～ ${range.end}</strong><small>${reviewWeekOffset === 0 ? "本周实时数据" : "历史周数据"}</small></div></div><button class="primary" id="saveAutoReview">保存本周复盘</button></div>
        <div class="review-stats">
          <div><span>任务完成</span><strong>${stats.done}/${stats.total}</strong><small>${stats.completion}%</small></div>
          <div><span>专注时间</span><strong>${minutesLabel(stats.focusMinutes)}</strong><small>${stats.focus.length} 轮</small></div>
          <div><span>新增错题</span><strong>${stats.errors.length}</strong><small>本周记录</small></div>
          <div><span>掌握错题</span><strong>${stats.mastered.length}</strong><small>本周复习</small></div>
        </div>
        <div class="review-grid">
          <article class="review-card"><header><h3>📊 模块完成情况</h3><p>根据本周计划任务自动计算。</p></header>${moduleRows}</article>
          <article class="review-card"><header><h3>🐰 自动小结</h3><p>先看数据，再决定下周怎么调整。</p></header>
            <div class="review-insight"><span>表现较稳</span><strong>${esc(stats.strongest?.name || "暂无")}</strong></div>
            <div class="review-insight"><span>需要关注</span><strong>${esc(stats.weakest?.name || "暂无")}</strong></div>
            <div class="review-suggestion">${esc(recommendation(stats))}</div>
          </article>
        </div>
        <article class="review-card review-writing"><header><h3>✍️ 一起写复盘</h3><p>保存后会进入长期记录，也会跟随完整存档同步。</p></header>
          <div class="form-grid">
            <label class="span-2">本周亮点<textarea id="reviewHighlights" placeholder="做得最好的事情、明显进步……">${esc(saved.highlights || "")}</textarea></label>
            <label class="span-2">本周问题<textarea id="reviewProblems" placeholder="拖延、错误类型、节奏问题……">${esc(saved.problems || "")}</textarea></label>
            <label>下周重点<input id="reviewFocus" value="${esc(saved.nextFocus || stats.weakest?.name || "")}" placeholder="例如：资料分析"></label>
            <label>下周调整<input id="reviewAdjustment" value="${esc(saved.adjustment || recommendation(stats))}"></label>
            <label class="span-2">哥哥复盘备注<textarea id="reviewCoach" placeholder="以后可以放 AI 教练生成的复盘。">${esc(saved.coach || "")}</textarea></label>
          </div>
        </article>
      </section>`;
  };

  function saveReview() {
    const range = weekRange(reviewWeekOffset);
    const stats = weekStats(range.start, range.end);
    const item = {
      weekStart: range.start, weekEnd: range.end,
      generatedAt: new Date().toISOString(),
      completion: stats.completion, completedTasks: stats.done, totalTasks: stats.total,
      focusMinutes: stats.focusMinutes, focusSessions: stats.focus.length,
      newErrors: stats.errors.length, masteredErrors: stats.mastered.length,
      strongest: stats.strongest?.name || "", weakest: stats.weakest?.name || "",
      highlights: document.getElementById("reviewHighlights")?.value.trim() || "",
      problems: document.getElementById("reviewProblems")?.value.trim() || "",
      nextFocus: document.getElementById("reviewFocus")?.value.trim() || "",
      adjustment: document.getElementById("reviewAdjustment")?.value.trim() || "",
      coach: document.getElementById("reviewCoach")?.value.trim() || ""
    };
    const index = state.weekly.findIndex(x => x.weekStart === range.start);
    if (index >= 0) state.weekly[index] = item; else state.weekly.push(item);
    saveState();
    alert("本周复盘已经保存啦 🌷");
    render();
  }

  function phasePct(phase) {
    const all = state.courses.filter(c => c.phase === phase);
    const done = all.filter(c => c.done).length;
    return { all: all.length, done, pct: all.length ? Math.round(done / all.length * 100) : 0 };
  }
  function statusText(exam) {
    const days = Math.max(0, daysUntil(exam.date));
    const base = phasePct("基础轮").pct;
    if (days <= 14 && base < 100) return "基础轮仍未完成，建议立刻压缩低优先级内容。";
    if (days <= 30 && phasePct("题海轮").pct < 50) return "距离考试较近，题海与真题训练需要提速。";
    return "当前按阶段推进，继续根据每周复盘动态调整。";
  }

  window.renderExams = function renderExams() {
    const next = nextExam();
    const timeline = EXAMS.map((exam, index) => {
      const days = daysUntil(exam.date);
      const note = state.examNotes[exam.date] || {};
      const passed = days < 0;
      return `<article class="exam-card ${exam.date === next.date ? "next" : ""} ${passed ? "passed" : ""}">
        <header><div><span class="exam-index">${index + 1}</span><div><h3>${esc(exam.name)}</h3><p>${exam.date}</p></div></div><strong>${passed ? "已结束" : `${Math.max(0, days)} 天`}</strong></header>
        <div class="exam-phase-list">${PHASES.map(p => { const x = phasePct(p); return `<div><span>${p}</span><div><i style="width:${x.pct}%"></i></div><b>${x.pct}%</b></div>`; }).join("")}</div>
        <p class="exam-status">${esc(statusText(exam))}</p>
        <div class="form-grid exam-fields">
          <label>行测成绩<input class="exam-field" data-date="${exam.date}" data-key="xingce" value="${esc(note.xingce || "")}"></label>
          <label>申论成绩<input class="exam-field" data-date="${exam.date}" data-key="shenlun" value="${esc(note.shenlun || "")}"></label>
          <label class="span-2">失分模块与考场问题<textarea class="exam-field" data-date="${exam.date}" data-key="problem">${esc(note.problem || "")}</textarea></label>
          <label class="span-2">下一阶段调整<textarea class="exam-field" data-date="${exam.date}" data-key="adjustment">${esc(note.adjustment || "")}</textarea></label>
        </div>
      </article>`;
    }).join("");
    return `${sectionHead("考试中心", "每场考试都是一次诊断：考前看进度，考后留下成绩与调整。")}
      <section class="exam-page">
        <div class="exam-hero"><div><span>🏰 下一站</span><h2>${esc(next.name)}</h2><p>${next.date} · 还有 ${Math.max(0, daysUntil(next.date))} 天</p></div><div class="exam-hero-mark">🐰🎯</div></div>
        <div class="exam-timeline">${timeline}</div>
      </section>`;
  };

  const originalBindPageEvents = bindPageEvents;
  bindPageEvents = function weeklyExamEvents() {
    originalBindPageEvents();
    document.getElementById("reviewPrev")?.addEventListener("click", () => { reviewWeekOffset--; render(); });
    document.getElementById("reviewNext")?.addEventListener("click", () => { reviewWeekOffset++; render(); });
    document.getElementById("reviewCurrent")?.addEventListener("click", () => { reviewWeekOffset = 0; render(); });
    document.getElementById("saveAutoReview")?.addEventListener("click", saveReview);
  };
})();