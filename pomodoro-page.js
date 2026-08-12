// Benny Study · 番茄钟与专注记录 v0.3
(function () {
  state.focusSessions ||= [];
  state.focusSettings ||= { focusMinutes: 25, shortBreak: 5, longBreak: 15 };
  timer.task = timer.task || "";
  timer.startedAt = timer.startedAt || null;
  timer.elapsedBeforePause = timer.elapsedBeforePause || 0;

  const originalSaveState = saveState;
  saveState = function patchedSaveState() {
    state.focusSessions ||= [];
    state.focusSettings ||= { focusMinutes: 25, shortBreak: 5, longBreak: 15 };
    originalSaveState();
  };

  function recordDateKey(value) {
    return window.BennyLocalTime?.dateKey(value) || String(value || "").slice(0, 10);
  }
  function recordTimeLabel(value) {
    return window.BennyLocalTime?.dateTimeLabel(value) || String(value || "").replace("T", " ").slice(0, 16);
  }
  function todaySessions() {
    const today = dateISO(new Date());
    return state.focusSessions.filter(x => recordDateKey(x.endedAt || x.date) === today && x.status === "completed");
  }
  function weekStartISO() {
    const d = new Date();
    const weekday = d.getDay() || 7;
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() - weekday + 1);
    return dateISO(d);
  }
  function completedMinutes(items) { return items.reduce((sum, x) => sum + Number(x.actualMinutes || x.plannedMinutes || 0), 0); }
  function formatMinutes(total) {
    const h = Math.floor(total / 60), m = Math.round(total % 60);
    return h ? `${h}小时${m ? m + "分" : ""}` : `${m}分钟`;
  }
  function modeLabel(mode) { return mode === "focus" ? "专注" : mode === "shortBreak" ? "短休息" : "长休息"; }
  function modeMinutes(mode) {
    return mode === "focus" ? state.focusSettings.focusMinutes : mode === "shortBreak" ? state.focusSettings.shortBreak : state.focusSettings.longBreak;
  }
  function setMode(mode) {
    clearInterval(timer.interval);
    const minutes = modeMinutes(mode);
    timer = { ...timer, mode, remaining: minutes * 60, total: minutes * 60, running: false, interval: null, startedAt: null, elapsedBeforePause: 0 };
    render();
  }
  function startTimer() {
    if (timer.running) return;
    timer.running = true;
    if (!timer.startedAt) timer.startedAt = new Date().toISOString();
    timer.interval = setInterval(() => {
      timer.remaining = Math.max(0, timer.remaining - 1);
      if (timer.remaining <= 0) finishSession(true);
      else if (currentPage === "pomodoro") render();
    }, 1000);
    render();
  }
  function pauseTimer() {
    clearInterval(timer.interval);
    timer.running = false;
    timer.interval = null;
    render();
  }
  function actualElapsedMinutes() {
    return Math.max(0, Math.round((timer.total - timer.remaining) / 60));
  }
  function finishSession(completed) {
    clearInterval(timer.interval);
    const actualMinutes = completed ? Math.round(timer.total / 60) : actualElapsedMinutes();
    if (timer.mode === "focus" && actualMinutes > 0) {
      state.focusSessions.push({
        id: `focus-${Date.now()}`,
        date: dateISO(new Date()),
        startedAt: timer.startedAt || new Date().toISOString(),
        endedAt: new Date().toISOString(),
        plannedMinutes: Math.round(timer.total / 60),
        actualMinutes,
        task: document.getElementById("focusTask")?.value.trim() || timer.task || "自由专注",
        status: completed ? "completed" : "stopped"
      });
      if (completed) timer.sessions = todaySessions().length + 1;
      saveState();
    }
    timer.running = false;
    timer.interval = null;
    timer.startedAt = null;
    timer.remaining = timer.total;
    if (completed && timer.mode === "focus") {
      setTimeout(() => alert("这一轮完成啦，起来喝口水吧 🌸"), 0);
    }
    render();
  }
  function resetCurrent() {
    clearInterval(timer.interval);
    timer.running = false;
    timer.interval = null;
    timer.startedAt = null;
    timer.remaining = timer.total;
    render();
  }

  window.renderPomodoro = function renderPomodoro() {
    const today = todaySessions();
    const week = state.focusSessions.filter(x => x.status === "completed" && recordDateKey(x.endedAt || x.date) >= weekStartISO());
    const totalToday = completedMinutes(today);
    const totalWeek = completedMinutes(week);
    const pct = timer.total ? Math.round((1 - timer.remaining / timer.total) * 100) : 0;
    const recent = state.focusSessions.slice(-12).reverse();
    return `${sectionHead("番茄钟", "专注时只做一件事，休息时就真的休息。")}
      <section class="focus-page">
        <div class="focus-summary">
          <div class="focus-stat"><span>今日专注</span><strong>${formatMinutes(totalToday)}</strong></div>
          <div class="focus-stat"><span>今日完成</span><strong>${today.length} 轮</strong></div>
          <div class="focus-stat"><span>本周专注</span><strong>${formatMinutes(totalWeek)}</strong></div>
          <div class="focus-stat"><span>累计记录</span><strong>${state.focusSessions.filter(x=>x.status==='completed').length} 轮</strong></div>
        </div>
        <div class="focus-layout">
          <article class="focus-timer-card">
            <div class="focus-mode-tabs">
              ${[["focus","专注"],["shortBreak","短休息"],["longBreak","长休息"]].map(([key,label])=>`<button class="focus-mode ${timer.mode===key?'active':''}" data-mode="${key}" type="button">${label}</button>`).join("")}
            </div>
            <div class="focus-settings">
              ${[25,50,90].map(m=>`<button class="focus-preset ${timer.mode==='focus' && Math.round(timer.total/60)===m?'active':''}" data-min="${m}" type="button">${m} 分钟</button>`).join("")}
            </div>
            <div class="focus-clock" style="--focus-value:${pct}">
              <div class="focus-clock-content"><strong>${formatTimer(timer.remaining)}</strong><span>${modeLabel(timer.mode)}</span></div>
            </div>
            ${timer.mode === "focus" ? `<label class="focus-task-field">这轮准备做什么？<input id="focusTask" maxlength="80" value="${esc(timer.task || '')}" placeholder="例如：资料分析课程 3"></label>` : ""}
            <div class="focus-actions">
              <button class="focus-primary" id="focusToggle" type="button">${timer.running ? "暂停" : timer.remaining < timer.total ? "继续" : "开始"}</button>
              <button class="secondary" id="focusReset" type="button">重置</button>
              ${timer.mode === "focus" && timer.remaining < timer.total ? `<button class="focus-danger" id="focusStop" type="button">提前结束并记录</button>` : ""}
            </div>
            <p class="focus-hint">关闭页面不会写入未完成记录；完成或“提前结束并记录”后才会保存。</p>
          </article>
          <article class="focus-history-card">
            <header><div><h3>最近专注</h3><p>每次认真坐下来的时间，都算数。</p></div><button class="secondary" id="exportFocus" type="button">导出记录</button></header>
            <div class="focus-records">${recent.length ? recent.map(x=>`<div class="focus-record"><span class="focus-record-icon">${x.status==='completed'?'🍅':'🌱'}</span><div><strong>${esc(x.task || '自由专注')}</strong><small>${recordTimeLabel(x.endedAt || x.date)} · ${x.status==='completed'?'已完成':'提前结束'}</small></div><span class="focus-record-time">${x.actualMinutes || 0} 分</span></div>`).join("") : `<div class="focus-empty">还没有专注记录，开始第一轮吧 🐰</div>`}</div>
          </article>
        </div>
      </section>`;
  };

  window.toggleTimer = function patchedToggleTimer() { timer.running ? pauseTimer() : startTimer(); };
  window.resetTimer = function patchedResetTimer(minutes) {
    clearInterval(timer.interval);
    timer.total = Number(minutes) * 60;
    timer.remaining = timer.total;
    timer.running = false;
    timer.interval = null;
    timer.startedAt = null;
    render();
  };

  const originalBindPageEvents = bindPageEvents;
  bindPageEvents = function patchedBindPageEvents() {
    originalBindPageEvents();
    document.querySelectorAll(".focus-mode").forEach(b => b.addEventListener("click", () => setMode(b.dataset.mode)));
    document.querySelectorAll(".focus-preset").forEach(b => b.addEventListener("click", () => {
      state.focusSettings.focusMinutes = Number(b.dataset.min);
      saveState();
      timer.mode = "focus";
      resetTimer(Number(b.dataset.min));
    }));
    document.getElementById("focusToggle")?.addEventListener("click", () => {
      timer.task = document.getElementById("focusTask")?.value.trim() || timer.task;
      timer.running ? pauseTimer() : startTimer();
    });
    document.getElementById("focusReset")?.addEventListener("click", resetCurrent);
    document.getElementById("focusStop")?.addEventListener("click", () => finishSession(false));
    document.getElementById("focusTask")?.addEventListener("input", e => { timer.task = e.target.value; });
    document.getElementById("exportFocus")?.addEventListener("click", () => downloadJSON(state.focusSessions, "benny-focus-sessions.json"));
  };

  timer.sessions = todaySessions().length;
})();
