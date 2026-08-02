// Benny Study · 每题耗时与训练档案 v1
(function () {
  state.training ||= { history: [] };
  state.training.history ||= [];

  let activeQuestion = null;
  let pendingQuestions = [];
  let lastHistoryLength = state.training.history.length;

  function text(selector) {
    return document.querySelector(selector)?.textContent?.trim() || "";
  }
  function now() { return performance.now(); }
  function seconds(ms) { return Number((ms / 1000).toFixed(2)); }
  function currentQuestionText() {
    return text(".training-question") || text(".memory-number") || text(".stroop-word");
  }
  function currentAnswerValue() {
    return document.querySelector("#v2Answer, #trainingAnswer, #memoryInput, #twentyFourInput")?.value?.trim() || "";
  }
  function beginQuestion() {
    const q = currentQuestionText();
    if (!q || activeQuestion?.question === q) return;
    activeQuestion = { question: q, startedAt: now() };
  }
  function captureSubmission() {
    if (!activeQuestion) beginQuestion();
    if (!activeQuestion) return;
    const answer = currentAnswerValue();
    activeQuestion.submittedAt = now();
    activeQuestion.timeMs = Math.max(0, activeQuestion.submittedAt - activeQuestion.startedAt);
    activeQuestion.userAnswer = answer;
    pendingQuestions.push(activeQuestion);
    activeQuestion = null;
  }
  function readFeedbackIntoLast() {
    const last = pendingQuestions.at(-1);
    if (!last) return;
    const fb = document.querySelector(".training-feedback");
    if (!fb || !fb.textContent.trim()) return;
    last.correct = fb.classList.contains("ok") || /答对/.test(fb.textContent);
    const match = fb.textContent.match(/正确答案[：:]\s*([^\s]+)/);
    if (match) last.correctAnswer = match[1];
  }
  function mergeIntoLatestHistory() {
    if (state.training.history.length <= lastHistoryLength || !pendingQuestions.length) return;
    const record = state.training.history.at(-1);
    const baseAnswers = Array.isArray(record.answers) ? record.answers : [];
    const details = pendingQuestions.map((q, i) => ({
      index: i + 1,
      question: q.question || baseAnswers[i]?.question || `第 ${i + 1} 题`,
      userAnswer: q.userAnswer ?? baseAnswers[i]?.userAnswer ?? "",
      correctAnswer: q.correctAnswer ?? baseAnswers[i]?.answer ?? "",
      correct: typeof q.correct === "boolean" ? q.correct : Boolean(baseAnswers[i]?.correct),
      timeMs: Math.round(q.timeMs || 0),
      timeSeconds: seconds(q.timeMs || 0)
    }));
    record.questionDetails = details;
    record.answers = baseAnswers.map((a, i) => ({ ...a, timeMs: details[i]?.timeMs || 0, timeSeconds: details[i]?.timeSeconds || 0 }));
    const times = details.map(x => x.timeSeconds).filter(Number.isFinite);
    if (times.length) {
      const sorted = [...times].sort((a,b) => a-b);
      record.fastestSeconds = sorted[0];
      record.slowestSeconds = sorted.at(-1);
      record.medianSeconds = sorted.length % 2 ? sorted[(sorted.length-1)/2] : Number(((sorted[sorted.length/2-1] + sorted[sorted.length/2]) / 2).toFixed(2));
      record.avgSeconds = Number((times.reduce((a,b)=>a+b,0) / times.length).toFixed(2));
    }
    saveState();
    pendingQuestions = [];
    lastHistoryLength = state.training.history.length;
  }

  document.addEventListener("click", e => {
    if (e.target.closest("#v2Submit, #trainingSubmit, #memorySubmit, #twentyFourSubmit, [data-stroop-answer]")) {
      captureSubmission();
      setTimeout(readFeedbackIntoLast, 10);
      setTimeout(mergeIntoLatestHistory, 700);
    }
  }, true);
  document.addEventListener("keydown", e => {
    if (e.key === "Enter" && e.target.matches("#v2Answer, #trainingAnswer, #memoryInput, #twentyFourInput")) {
      captureSubmission();
      setTimeout(readFeedbackIntoLast, 10);
      setTimeout(mergeIntoLatestHistory, 700);
    }
  }, true);

  const observer = new MutationObserver(() => {
    beginQuestion();
    readFeedbackIntoLast();
    mergeIntoLatestHistory();
    decorateHistory();
  });
  observer.observe(document.getElementById("app"), { childList: true, subtree: true, characterData: true });

  function decorateHistory() {
    if (currentPage !== "aptitude") return;
    const rows = [...document.querySelectorAll(".training-history-row")];
    const history = state.training.history.slice().reverse();
    rows.forEach((row, i) => {
      if (row.querySelector(".training-detail-button")) return;
      const record = history[i];
      if (!record) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "secondary training-detail-button";
      button.textContent = "查看详情";
      button.addEventListener("click", () => showArchive(state.training.history.length - 1 - i));
      row.appendChild(button);
    });
  }

  function fmt(v) { return Number(v || 0).toFixed(2).replace(/\.00$/, ""); }
  function showArchive(index) {
    const r = state.training.history[index];
    if (!r) return;
    const details = r.questionDetails || (r.answers || []).map((x, i) => ({
      index: i + 1, question: x.question, userAnswer: x.userAnswer,
      correctAnswer: x.answer, correct: x.correct, timeSeconds: x.timeSeconds || 0
    }));
    const max = Math.max(1, ...details.map(x => Number(x.timeSeconds || 0)));
    const correct = details.filter(x => x.correct).length || Number(r.correct || 0);
    document.getElementById("app").innerHTML = `${sectionHead("训练档案", `${esc(r.title || "专项训练")} · ${esc(r.date || "")}`, `<button class="secondary" id="archiveBack">← 返回训练大厅</button>`)}
      <section class="archive-summary">
        <div><span>正确率</span><strong>${r.accuracy || (r.total ? Math.round(correct/r.total*100) : 0)}%</strong></div>
        <div><span>平均每题</span><strong>${fmt(r.avgSeconds)} 秒</strong></div>
        <div><span>最快</span><strong>${fmt(r.fastestSeconds)} 秒</strong></div>
        <div><span>最慢</span><strong>${fmt(r.slowestSeconds)} 秒</strong></div>
        <div><span>中位数</span><strong>${fmt(r.medianSeconds)} 秒</strong></div>
      </section>
      <section class="archive-card">
        <h3>每题耗时曲线</h3>
        <div class="archive-bars">${details.map(x => `<div class="archive-bar-row"><span>${x.index}</span><i style="width:${Math.max(4, Number(x.timeSeconds||0)/max*100)}%" class="${x.correct?'ok':'wrong'}"></i><b>${fmt(x.timeSeconds)}s</b></div>`).join("") || `<div class="training-empty">旧记录没有逐题耗时；从下一场训练开始会完整记录。</div>`}</div>
      </section>
      <section class="archive-card">
        <h3>逐题回放</h3>
        <div class="archive-table-wrap"><table class="archive-table"><thead><tr><th>#</th><th>题目</th><th>你的答案</th><th>正确答案</th><th>结果</th><th>耗时</th></tr></thead><tbody>${details.map(x => `<tr><td>${x.index}</td><td>${esc(x.question||"")}</td><td>${esc(x.userAnswer??"")}</td><td>${esc(x.correctAnswer??"")}</td><td>${x.correct?'✅':'❌'}</td><td>${fmt(x.timeSeconds)} 秒</td></tr>`).join("")}</tbody></table></div>
      </section>`;
    document.getElementById("archiveBack")?.addEventListener("click", () => { currentPage = "aptitude"; render(); });
  }

  setTimeout(decorateHistory, 0);
})();