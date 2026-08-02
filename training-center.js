// Benny Study · Training Engine v1
(function () {
  state.training ||= { history: [] };
  state.training.history ||= [];
  state.training.settings ||= { questionCount: 20 };

  const catalog = {
    arithmetic: {
      title: "计算能力",
      icon: "🧮",
      description: "练数字敏感度、基础运算速度和资料分析常用计算。",
      items: [
        { id: "two-add-sub", title: "两位数加减", desc: "两位数加减混合", generator: genTwoAddSub },
        { id: "three-add-sub", title: "三位数加减", desc: "三位数加减混合", generator: genThreeAddSub },
        { id: "multi-add", title: "多数相加", desc: "3—5 个数连续相加", generator: genMultiAdd },
        { id: "multiply", title: "乘法速算", desc: "两位数乘一位数/整十数", generator: genMultiply },
        { id: "divide-estimate", title: "除法估算", desc: "常见整除与近似商", generator: genDivide },
        { id: "percent", title: "百分数换算", desc: "小数、分数、百分数互换", generator: genPercent }
      ]
    },
    reasoning: {
      title: "数字推理",
      icon: "🔢",
      description: "基础数列、多级数列、幂次与递推等题型。",
      items: []
    },
    thinking: {
      title: "思维能力",
      icon: "🧠",
      description: "舒尔特方格、瞬间记忆、24 点、斯特鲁普等训练。",
      items: []
    },
    data: {
      title: "资料分析专项",
      icon: "📊",
      description: "增长率、基期量、增长量、比重、平均数等速算专项。",
      items: []
    }
  };

  let ui = { view: "hall", category: null, type: null, session: null, result: null };

  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function pick(arr) { return arr[rand(0, arr.length - 1)]; }
  function question(text, answer, extra = {}) { return { id: `q-${Date.now()}-${Math.random()}`, text, answer: Number(answer), ...extra }; }

  function genTwoAddSub() {
    const a = rand(12, 99), b = rand(11, 89), op = Math.random() > .5 ? "+" : "-";
    if (op === "-") { const hi = Math.max(a, b), lo = Math.min(a, b); return question(`${hi} − ${lo}`, hi - lo); }
    return question(`${a} + ${b}`, a + b);
  }
  function genThreeAddSub() {
    const a = rand(120, 999), b = rand(101, 899), op = Math.random() > .5 ? "+" : "-";
    if (op === "-") { const hi = Math.max(a, b), lo = Math.min(a, b); return question(`${hi} − ${lo}`, hi - lo); }
    return question(`${a} + ${b}`, a + b);
  }
  function genMultiAdd() {
    const nums = Array.from({ length: rand(3, 5) }, () => rand(12, 199));
    return question(nums.join(" + "), nums.reduce((a, b) => a + b, 0));
  }
  function genMultiply() {
    const a = rand(12, 99), b = Math.random() > .5 ? rand(2, 9) : pick([10, 20, 30, 40, 50]);
    return question(`${a} × ${b}`, a * b);
  }
  function genDivide() {
    const divisor = rand(2, 12), quotient = rand(4, 99);
    return question(`${divisor * quotient} ÷ ${divisor}`, quotient);
  }
  function genPercent() {
    const pairs = [[0.1,10],[0.125,12.5],[0.2,20],[0.25,25],[0.4,40],[0.5,50],[0.625,62.5],[0.75,75],[0.8,80]];
    const [decimal, percent] = pick(pairs);
    return question(`${decimal} = ?%`, percent, { suffix: "%" });
  }

  function getType(categoryId, typeId) {
    return catalog[categoryId]?.items.find(x => x.id === typeId);
  }
  function historyStats() {
    const rows = state.training.history || [];
    const total = rows.reduce((s, x) => s + Number(x.total || 0), 0);
    const correct = rows.reduce((s, x) => s + Number(x.correct || 0), 0);
    return { sessions: rows.length, total, accuracy: total ? Math.round(correct / total * 100) : 0 };
  }
  function latestHistory() { return (state.training.history || []).slice(-8).reverse(); }

  function renderHall() {
    const stats = historyStats();
    return `${sectionHead("行测训练室", "不是普通题库，而是专门训练计算、数字推理、注意力与资料分析底层能力。")}
      <section class="training-summary">
        <div><span>累计训练</span><strong>${stats.sessions} 次</strong></div>
        <div><span>累计题量</span><strong>${stats.total} 题</strong></div>
        <div><span>综合正确率</span><strong>${stats.accuracy}%</strong></div>
      </section>
      <section class="training-hall">
        ${Object.entries(catalog).map(([id, cat]) => `<button class="training-zone ${id}" data-training-category="${id}" type="button">
          <span class="training-zone-icon">${cat.icon}</span>
          <span><strong>${cat.title}</strong><small>${cat.description}</small></span>
          <em>${cat.items.length ? `${cat.items.length} 项可训练` : "即将开放"}</em>
        </button>`).join("")}
      </section>
      <section class="training-history-card">
        <header><div><h3>最近训练</h3><p>只和昨天的自己比。</p></div><button class="secondary" id="exportTrainingV2" type="button">导出记录</button></header>
        <div class="training-history-list">${latestHistory().length ? latestHistory().map(x => `<div class="training-history-row"><span>🧠</span><div><strong>${esc(x.title || x.type || "专项训练")}</strong><small>${esc(x.date || "")} · ${x.correct}/${x.total} · ${x.accuracy}%</small></div><b>${Number(x.durationSeconds || 0)} 秒</b></div>`).join("") : `<div class="training-empty">还没有训练记录，先从两位数加减开始吧 🐰</div>`}</div>
      </section>`;
  }

  function renderCategory() {
    const cat = catalog[ui.category];
    return `${sectionHead(`${cat.icon} ${cat.title}`, cat.description, `<button class="secondary" id="trainingBackHall" type="button">← 返回训练大厅</button>`)}
      <section class="training-type-grid">
        ${cat.items.length ? cat.items.map(item => `<button class="training-type-card" data-training-type="${item.id}" type="button"><span>✦</span><strong>${item.title}</strong><small>${item.desc}</small></button>`).join("") : `<div class="training-empty">这一分区稍后继续补充。</div>`}
      </section>`;
  }

  function renderSetup() {
    const item = getType(ui.category, ui.type);
    const count = Number(state.training.settings.questionCount || 20);
    return `${sectionHead(item.title, item.desc, `<button class="secondary" id="trainingBackCategory" type="button">← 返回${catalog[ui.category].title}</button>`)}
      <section class="training-setup-card">
        <div class="training-setup-art">🧮🐰</div>
        <div class="training-setup-options">
          <h3>训练设置</h3>
          <label>题量<select id="trainingQuestionCount">${[10,20,30,50].map(n=>`<option value="${n}" ${n===count?'selected':''}>${n} 题</option>`).join("")}</select></label>
          <p>支持键盘输入；回车提交答案。训练结束后自动保存正确率、耗时和平均每题用时。</p>
          <button class="primary training-start" id="trainingStart" type="button">开始训练</button>
        </div>
      </section>`;
  }

  function startSession() {
    const item = getType(ui.category, ui.type);
    const count = Number(document.getElementById("trainingQuestionCount")?.value || 20);
    state.training.settings.questionCount = count;
    saveState();
    ui.session = { title: item.title, questions: Array.from({length: count}, () => item.generator()), index: 0, correct: 0, answers: [], startedAt: Date.now() };
    ui.view = "session"; ui.result = null; render();
  }

  function renderSession() {
    const s = ui.session, q = s.questions[s.index], pct = Math.round((s.index / s.questions.length) * 100);
    return `<section class="training-session">
      <header><button class="secondary" id="trainingQuit" type="button">结束训练</button><div><strong>${esc(s.title)}</strong><small>第 ${s.index + 1} / ${s.questions.length} 题</small></div><span>${pct}%</span></header>
      <div class="training-session-progress"><i style="width:${pct}%"></i></div>
      <article class="training-question-card">
        <span class="training-question-label">请计算</span>
        <div class="training-question">${esc(q.text)}</div>
        <div class="training-answer-row"><input id="trainingAnswer" inputmode="decimal" autocomplete="off" placeholder="输入答案"><span>${esc(q.suffix || "")}</span><button class="primary" id="trainingSubmit" type="button">提交</button></div>
        <p id="trainingFeedback" class="training-feedback"></p>
      </article>
    </section>`;
  }

  function submitAnswer() {
    const s = ui.session, q = s.questions[s.index];
    const input = document.getElementById("trainingAnswer");
    const value = Number(input.value.trim());
    if (!Number.isFinite(value)) { input.focus(); return; }
    const ok = Math.abs(value - Number(q.answer)) < 0.0001;
    if (ok) s.correct++;
    s.answers.push({ question: q.text, answer: q.answer, userAnswer: value, correct: ok });
    const feedback = document.getElementById("trainingFeedback");
    feedback.textContent = ok ? "答对啦 ✨" : `正确答案：${q.answer}${q.suffix || ""}`;
    feedback.className = `training-feedback ${ok ? "ok" : "wrong"}`;
    setTimeout(() => { s.index++; if (s.index >= s.questions.length) finishTraining(); else render(); }, 420);
  }

  function finishTraining() {
    const s = ui.session;
    const durationSeconds = Math.max(1, Math.round((Date.now() - s.startedAt) / 1000));
    const result = { id: `training-${Date.now()}`, date: new Date().toISOString().slice(0,16).replace("T"," "), category: ui.category, type: ui.type, title: s.title, total: s.questions.length, correct: s.correct, accuracy: Math.round(s.correct / s.questions.length * 100), durationSeconds, avgSeconds: Number((durationSeconds / s.questions.length).toFixed(1)), answers: s.answers };
    state.training.history.push(result); saveState(); ui.result = result; ui.view = "result"; render();
  }

  function renderResult() {
    const r = ui.result;
    return `${sectionHead("训练完成", "这次训练已经自动保存到成长记录。")}
      <section class="training-result-card">
        <div class="training-result-medal">${r.accuracy >= 90 ? "🏆" : r.accuracy >= 70 ? "🌟" : "🌱"}</div>
        <h2>${esc(r.title)}</h2>
        <div class="training-result-stats"><div><span>正确</span><strong>${r.correct}/${r.total}</strong></div><div><span>正确率</span><strong>${r.accuracy}%</strong></div><div><span>总耗时</span><strong>${r.durationSeconds} 秒</strong></div><div><span>平均每题</span><strong>${r.avgSeconds} 秒</strong></div></div>
        <div class="training-result-actions"><button class="primary" id="trainingAgain" type="button">再练一次</button><button class="secondary" id="trainingResultHall" type="button">返回大厅</button></div>
      </section>`;
  }

  window.renderAptitude = function renderTrainingCenter() {
    if (ui.view === "category") return renderCategory();
    if (ui.view === "setup") return renderSetup();
    if (ui.view === "session") return renderSession();
    if (ui.view === "result") return renderResult();
    return renderHall();
  };

  const originalBind = bindPageEvents;
  bindPageEvents = function patchedTrainingEvents() {
    originalBind();
    document.querySelectorAll("[data-training-category]").forEach(b => b.addEventListener("click", () => { ui.category = b.dataset.trainingCategory; ui.view = "category"; render(); }));
    document.querySelectorAll("[data-training-type]").forEach(b => b.addEventListener("click", () => { ui.type = b.dataset.trainingType; ui.view = "setup"; render(); }));
    document.getElementById("trainingBackHall")?.addEventListener("click", () => { ui.view = "hall"; render(); });
    document.getElementById("trainingBackCategory")?.addEventListener("click", () => { ui.view = "category"; render(); });
    document.getElementById("trainingStart")?.addEventListener("click", startSession);
    document.getElementById("trainingSubmit")?.addEventListener("click", submitAnswer);
    document.getElementById("trainingAnswer")?.addEventListener("keydown", e => { if (e.key === "Enter") submitAnswer(); });
    document.getElementById("trainingAnswer")?.focus();
    document.getElementById("trainingQuit")?.addEventListener("click", () => { if (confirm("结束本次训练吗？当前进度不会保存。")) { ui.view = "hall"; ui.session = null; render(); } });
    document.getElementById("trainingAgain")?.addEventListener("click", () => { ui.view = "setup"; render(); });
    document.getElementById("trainingResultHall")?.addEventListener("click", () => { ui.view = "hall"; render(); });
    document.getElementById("exportTrainingV2")?.addEventListener("click", () => downloadJSON(state.training.history, "benny-training-history.json"));
  };
})();