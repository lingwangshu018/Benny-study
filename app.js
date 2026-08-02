const NAV_ITEMS = [
  ["home", "首页"], ["courses", "完整课程库"], ["plan", "每日执行计划"],
  ["today", "今日任务"], ["errors", "错题库"], ["progress", "学习进度"],
  ["weekly", "每周复盘"], ["exams", "考试中心"], ["pomodoro", "番茄钟"],
  ["aptitude", "行测训练"]
];
const PHASES = ["基础轮", "题海轮", "突破轮", "模拟轮"];
const EXAMS = [
  { date: "2026-09-19", name: "第一次考试" }, { date: "2026-10-25", name: "第二次考试" },
  { date: "2026-11-29", name: "第三次考试" }, { date: "2026-12-06", name: "第四次考试" }
];
const STORAGE_KEY = "benny-study-v1";
const SETTINGS_KEY = "benny-study-github-settings";
const DEFAULT_STATE = {
  courses: [], plan: [], errors: [], weekly: [], examNotes: {},
  settings: { startDate: "2026-08-03", baseTarget: "2026-08-16", baseMax: "2026-08-23", baseVideoHours: 8, laterVideoHours: 4 },
  training: { history: [] }, meta: { lastSavedAt: null }
};
let state = loadState();
let currentPage = location.hash.replace("#", "") || "home";
let timer = { mode: "focus", remaining: 25 * 60, total: 25 * 60, running: false, interval: null, sessions: 0 };

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function loadState() {
  try { return { ...clone(DEFAULT_STATE), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }; }
  catch { return clone(DEFAULT_STATE); }
}
function saveState() {
  state.meta.lastSavedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function esc(value) { return String(value ?? "").replace(/[&<>'"]/g, s => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[s])); }
function dateISO(d) { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`; }
function addDays(d, n) { const x = new Date(`${d}T00:00:00`); x.setDate(x.getDate() + n); return dateISO(x); }
function parseMinutes(text) {
  const s = String(text || "");
  const h = Number((s.match(/(\d+)\s*小时/) || [0,0])[1]);
  const m = Number((s.match(/(\d+)\s*分/) || [0,0])[1]);
  return h * 60 + m;
}
function isExam(date) { return EXAMS.some(x => x.date === date); }
function phaseColor(phase) { return ({ 基础轮: "#eee9fb", 题海轮: "#e8f2fb", 突破轮: "#f8e9f0", 模拟轮: "#fff7e9" })[phase] || "#f3f4f6"; }
function daysUntil(date) { return Math.ceil((new Date(`${date}T00:00:00`) - new Date()) / 86400000); }
function nextExam() { return EXAMS.find(x => daysUntil(x.date) >= 0) || EXAMS.at(-1); }
function taskId(c) { return c.id || `${c.phase}|${c.module}|${c.chapter}|${c.name}`; }
function completedCourses(phase) { return state.courses.filter(c => c.phase === phase && c.done).length; }

function setupNav() {
  const nav = document.getElementById("mainNav");
  nav.innerHTML = NAV_ITEMS.map(([id, label]) => `<button class="nav-button ${id===currentPage?'active':''}" data-page="${id}" type="button">${label}</button>`).join("");
  document.querySelectorAll("[data-page]").forEach(btn => btn.addEventListener("click", () => navigate(btn.dataset.page)));
}
function navigate(page) { currentPage = page; location.hash = page; setupNav(); render(); }
window.addEventListener("hashchange", () => { currentPage = location.hash.replace("#", "") || "home"; setupNav(); render(); });

function render() {
  const app = document.getElementById("app");
  const pages = { home: renderHome, courses: renderCourses, plan: renderPlan, today: renderToday, errors: renderErrors, progress: renderProgress, weekly: renderWeekly, exams: renderExams, pomodoro: renderPomodoro, aptitude: renderAptitude };
  app.innerHTML = (pages[currentPage] || renderHome)();
  bindPageEvents();
}
function sectionHead(title, text, actions = "") { return `<div class="section-head"><div><h2>${title}</h2><p>${text}</p></div>${actions}</div>`; }
function empty(text) { return `<div class="empty">${text}</div>`; }
function hero() {
  const exam = nextExam(); const days = Math.max(0, daysUntil(exam.date));
  return `<section class="hero"><div><span class="badge">🌸 小兔上岸计划</span><h1>欢迎回来，小宝。</h1><p>今天也不用一下子变得很厉害，只要把安排好的那一小段路走完。晚上只留给错题，哥哥已经记住啦。</p></div><div class="hero-side"><div class="hero-mascot">🐰📚</div><div class="countdown"><small>${esc(exam.name)}</small><b>${days} 天</b><span>${exam.date}</span></div></div></section>`;
}
function renderHome() {
  const total = state.courses.length, done = state.courses.filter(c => c.done).length;
  const today = state.plan.find(x => x.date === dateISO(new Date()));
  return `${hero()}<section class="section"><div class="grid grid-4">${PHASES.map(p => { const all=state.courses.filter(c=>c.phase===p).length, d=completedCourses(p), pct=all?Math.round(d/all*100):0; return `<div class="card"><span class="badge" style="background:${phaseColor(p)}">${p}</span><div class="metric">${d} / ${all}</div><div class="progress"><i style="width:${pct}%"></i></div><p>${pct}% 已完成</p></div>`; }).join("")}</div></section>
  <section class="section">${sectionHead("今天的作战卡", today ? `${today.date} · ${today.phase}` : "还没有生成今日任务", `<button class="primary" id="goToday">打开今日任务</button>`)}${today ? dayCard(today, true) : empty("先到“完整课程库”导入 Excel，再点击自动排课。")}</section>
  <section class="section"><div class="grid grid-3"><div class="card"><h3>📚 总课程</h3><div class="metric">${total}</div><p>完成 ${done} 项，剩余 ${Math.max(0,total-done)} 项。</p></div><div class="card"><h3>🌷 错题花园</h3><div class="metric">${state.errors.length}</div><p>已掌握 ${state.errors.filter(x=>x.status==='已掌握').length} 道。</p></div><div class="card"><h3>⏱ 专注次数</h3><div class="metric">${timer.sessions}</div><p>今天完成的番茄钟。</p></div></div></section>`;
}

function renderCourses() {
  const rows = state.courses.map(c => `<tr><td><input type="checkbox" class="course-done" data-id="${esc(taskId(c))}" ${c.done?'checked':''}></td><td>${esc(c.phase)}</td><td>${esc(c.module)}</td><td>${esc(c.chapter)}</td><td>${esc(c.name)}</td><td>${esc(c.type==='pages'?'页数/刷题':c.duration)}</td><td>${c.planDate||''}</td></tr>`).join("");
  return `${sectionHead("完整课程库", "对应 Excel 的完整课程库；任何课程都不会因为排不下而被删除。", `<div class="toolbar"><button class="primary" id="importExcel">导入 Excel</button><button class="secondary" id="autoSchedule">自动排课</button><button class="secondary" id="exportAllJson">导出全部存档</button><button class="secondary" id="importAllJson">导入存档</button></div>`)}
  <div class="card"><div class="form-grid"><label>开始日期<input id="startDateSetting" type="date" value="${state.settings.startDate}"></label><label>基础轮目标日期<input id="baseTargetSetting" type="date" value="${state.settings.baseTarget}"></label><label>基础轮最晚日期<input id="baseMaxSetting" type="date" value="${state.settings.baseMax}"></label><label>基础轮每日 2 倍速课程小时<input id="baseHoursSetting" type="number" min="1" step=".5" value="${state.settings.baseVideoHours}"></label><label>后续阶段每日课程小时<input id="laterHoursSetting" type="number" min="1" step=".5" value="${state.settings.laterVideoHours}"></label></div></div>
  <section class="section"><div class="table-wrap">${rows ? `<table class="data-table"><thead><tr><th>完成</th><th>阶段</th><th>模块</th><th>章节</th><th>课程/资源</th><th>时长/类型</th><th>计划日期</th></tr></thead><tbody>${rows}</tbody></table>` : empty("还没有课程。请选择公考备考课程集合 Excel 导入。")}</div></section>`;
}
function renderPlan() {
  return `${sectionHead("每日执行计划", "阶段完成后第二天立即进入下一轮；基础轮只在确实排不下时启用最多一周延期。", `<button class="primary" id="autoSchedule">重新排课</button>`)}${state.plan.length ? state.plan.map(x=>dayCard(x)).join("") : empty("还没有日程。先导入 Excel 并自动排课。")}`;
}
function renderToday() {
  const today = dateISO(new Date()); const item = state.plan.find(x=>x.date===today) || state.plan.find(x=>!x.completed) || state.plan[0];
  return `${sectionHead("今日任务", item ? `${item.date} · ${item.phase}` : "暂时没有任务", `<button class="secondary" id="goPomodoro">开始番茄钟</button>`)}${item ? dayCard(item,true) : empty("先生成每日执行计划。")}`;
}
function dayCard(day, compact=false) {
  const morning = day.tasks.filter(x=>x.slot==='morning'); const afternoon=day.tasks.filter(x=>x.slot==='afternoon');
  const taskRows = arr => arr.length ? arr.map(c=>`<label class="check-row"><input class="plan-task-check" data-id="${esc(taskId(c))}" type="checkbox" ${c.done?'checked':''}><span><b>${esc(c.module)}</b> · ${esc(c.chapter)} · ${esc(c.name)} ${c.type==='video'?`（2倍速约 ${Math.round(c.minutes/2)} 分钟）`:'（刷题/页数任务）'}</span></label>`).join("") : "对应章节练习 / 机动补漏";
  return `<article class="task-day"><header><div><strong>${day.date}</strong> <span class="badge" style="background:${phaseColor(day.phase)}">${day.phase}</span></div><span>${day.tasks.length} 项</span></header><div class="task-columns"><div class="task-slot"><h4>☀️ 上午</h4>${taskRows(morning)}</div><div class="task-slot"><h4>🌤 下午</h4>${taskRows(afternoon)}</div><div class="task-slot"><h4>🌙 晚上</h4><p>只整理错题：写清错误原因、正确方法和复习日期。</p><button class="secondary add-error-from-day" data-date="${day.date}" type="button">记录今天的错题</button></div></div>${compact?'':`<p>预计 2 倍速课程：${day.videoHours.toFixed(1)} 小时</p>`}</article>`;
}

function renderErrors() {
  const rows = state.errors.map((e,i)=>`<tr><td>${i+1}</td><td>${esc(e.date)}</td><td>${esc(e.subject)}</td><td>${esc(e.chapter)}</td><td>${esc(e.type)}</td><td>${esc(e.reason)}</td><td>${esc(e.method)}</td><td>${esc(e.reviewDate)}</td><td>${esc(e.status)}</td><td><button class="secondary edit-error" data-index="${i}">编辑</button> <button class="danger delete-error" data-index="${i}">删除</button></td></tr>`).join("");
  return `${sectionHead("错题库", "数据先保存在浏览器，可导入导出 JSON，也可备份到 GitHub 仓库。", `<div class="toolbar"><button class="primary" id="newError">新增错题</button><button class="secondary" id="exportErrors">导出错题</button><button class="secondary" id="importErrors">导入错题</button><button class="secondary" id="openCloud">GitHub 云存档</button></div>`)}
  <div id="errorFormHost"></div><div class="table-wrap">${rows?`<table class="data-table"><thead><tr><th>#</th><th>日期</th><th>科目</th><th>章节/题型</th><th>错误类型</th><th>错误原因</th><th>正确方法</th><th>复习日期</th><th>状态</th><th>操作</th></tr></thead><tbody>${rows}</tbody></table>`:empty("错题花园还是空的。每解决一个错误，就会多开一朵花。🌱")}</div>`;
}
function errorForm(index=null, presetDate="") {
  const e=index===null?{date:presetDate||dateISO(new Date()),subject:"资料分析",chapter:"",type:"方法不会",reason:"",method:"",reviewDate:addDays(dateISO(new Date()),3),status:"待复习"}:state.errors[index];
  return `<div class="card form-card"><h3>${index===null?'新增错题':'编辑错题'}</h3><div class="form-grid"><label>日期<input id="errDate" type="date" value="${esc(e.date)}"></label><label>科目<select id="errSubject">${["资料分析","数量关系","判断推理","言语理解","常识","申论"].map(x=>`<option ${x===e.subject?'selected':''}>${x}</option>`).join('')}</select></label><label>章节/题型<input id="errChapter" value="${esc(e.chapter)}"></label><label>错误类型<select id="errType">${["概念不清","方法不会","审题错误","计算错误","时间不足","粗心","其他"].map(x=>`<option ${x===e.type?'selected':''}>${x}</option>`).join('')}</select></label><label class="span-2">错误原因<textarea id="errReason">${esc(e.reason)}</textarea></label><label class="span-2">正确方法<textarea id="errMethod">${esc(e.method)}</textarea></label><label>复习日期<input id="errReview" type="date" value="${esc(e.reviewDate)}"></label><label>状态<select id="errStatus">${["待复习","已复习","已掌握"].map(x=>`<option ${x===e.status?'selected':''}>${x}</option>`).join('')}</select></label></div><div><button class="primary" id="saveError" data-index="${index===null?'':index}">保存错题</button> <button class="secondary" id="cancelError">取消</button></div></div>`;
}

function renderProgress() {
  return `${sectionHead("学习进度", "按阶段查看完成率和剩余任务。")}
  <div class="grid grid-4">${PHASES.map(p=>{const all=state.courses.filter(c=>c.phase===p),d=all.filter(c=>c.done).length,pct=all.length?Math.round(d/all.length*100):0;return `<div class="card"><span class="badge" style="background:${phaseColor(p)}">${p}</span><div class="metric">${pct}%</div><div class="progress"><i style="width:${pct}%"></i></div><p>${d} / ${all.length} 项完成</p></div>`}).join('')}</div>
  <section class="section"><div class="grid grid-2"><div class="card"><h3>错题状态</h3><p>待复习：${state.errors.filter(x=>x.status==='待复习').length}</p><p>已复习：${state.errors.filter(x=>x.status==='已复习').length}</p><p>已掌握：${state.errors.filter(x=>x.status==='已掌握').length}</p></div><div class="card"><h3>存档状态</h3><p>最后本地保存：${state.meta.lastSavedAt?new Date(state.meta.lastSavedAt).toLocaleString():'尚未保存'}</p><p>课程总数：${state.courses.length}</p><p>日程天数：${state.plan.length}</p></div></div></section>`;
}
function renderWeekly() {
  const rows = state.weekly.map((w,i)=>`<tr><td>${esc(w.week)}</td><td>${esc(w.hours)}</td><td>${esc(w.highlights)}</td><td>${esc(w.problems)}</td><td>${esc(w.weakness)}</td><td>${esc(w.adjustment)}</td><td><button class="danger delete-week" data-index="${i}">删除</button></td></tr>`).join('');
  return `${sectionHead("每周复盘", "每周固定记录一次，计划才能越用越贴合你。", `<button class="primary" id="newWeekly">新增周复盘</button>`)}<div id="weeklyFormHost"></div><div class="table-wrap">${rows?`<table class="data-table"><thead><tr><th>周次</th><th>学习小时</th><th>完成亮点</th><th>本周问题</th><th>薄弱模块</th><th>下周调整</th><th>操作</th></tr></thead><tbody>${rows}</tbody></table>`:empty("本周结束时来这里留下第一篇复盘。")}</div>`;
}
function weeklyForm() { return `<div class="card form-card"><h3>新增周复盘</h3><div class="form-grid"><label>周次<input id="weekName" placeholder="例如：8/3–8/9"></label><label>学习小时<input id="weekHours" type="number" min="0" step=".5"></label><label class="span-2">完成亮点<textarea id="weekHighlights"></textarea></label><label class="span-2">本周问题<textarea id="weekProblems"></textarea></label><label>薄弱模块<input id="weekWeakness"></label><label>下周调整<input id="weekAdjustment"></label></div><button class="primary" id="saveWeekly">保存复盘</button></div>`; }
function renderExams() {
  return `${sectionHead("考试中心", "四次考试既是目标，也是四次非常珍贵的实战诊断。")}${EXAMS.map(e=>{const n=state.examNotes[e.date]||{};return `<div class="card section"><div class="section-head"><div><h3>${e.date} · ${e.name}</h3><p>距离考试 ${Math.max(0,daysUntil(e.date))} 天</p></div></div><div class="form-grid"><label>行测成绩<input class="exam-field" data-date="${e.date}" data-key="xingce" value="${esc(n.xingce||'')}"></label><label>申论成绩<input class="exam-field" data-date="${e.date}" data-key="shenlun" value="${esc(n.shenlun||'')}"></label><label class="span-2">失分模块与考场问题<textarea class="exam-field" data-date="${e.date}" data-key="problem">${esc(n.problem||'')}</textarea></label><label class="span-2">下一阶段调整<textarea class="exam-field" data-date="${e.date}" data-key="adjustment">${esc(n.adjustment||'')}</textarea></label></div></div>`}).join('')}`;
}

function renderPomodoro() {
  const pct = 100 - timer.remaining / timer.total * 100;
  return `${sectionHead("番茄钟", "专注时只做一件事。时间到了就站起来喝口水。")}
  <div class="card pomodoro"><div class="timer-ring" style="--timer-progress:${pct}%"><div class="timer-content"><div class="timer-value">${formatTimer(timer.remaining)}</div><div class="timer-mode">${timer.mode==='focus'?'专注':'休息'}</div></div></div><div class="toolbar" style="justify-content:center"><button class="primary" id="timerToggle">${timer.running?'暂停':'开始'}</button><button class="secondary timerPreset" data-min="25">25 分钟</button><button class="secondary timerPreset" data-min="50">50 分钟</button><button class="secondary" id="timerReset">重置</button></div><p>今日完成 ${timer.sessions} 个番茄钟。</p></div>`;
}
function formatTimer(sec){return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;}

const QUIZ_BANK = [
  { subject:"资料分析", q:"某指标由 200 增长到 250，增长率是多少？", options:["20%","25%","50%","125%"], answer:1, explain:"增长率=(250-200)/200=25%。" },
  { subject:"数量关系", q:"一项工程甲单独 6 天完成，乙单独 3 天完成，合作需要几天？", options:["1天","2天","3天","4天"], answer:1, explain:"效率为1/6+1/3=1/2，因此2天完成。" },
  { subject:"判断推理", q:"所有公务员都遵守纪律；小李是公务员。可以推出什么？", options:["小李遵守纪律","遵守纪律的都是公务员","小李不是公务员","无法判断"], answer:0, explain:"由全称命题和个体归属可直接推出小李遵守纪律。" },
  { subject:"言语理解", q:"“因地制宜”最接近下列哪项含义？", options:["墨守成规","根据实际情况采取办法","一视同仁","临时起意"], answer:1, explain:"因地制宜强调依据不同地区或具体情况采取适当措施。" }
];
let activeQuestion = 0;
function renderAptitude() {
  const q=QUIZ_BANK[activeQuestion%QUIZ_BANK.length];
  return `${sectionHead("行测训练室", "这里先放轻量小题练习，后续可以导入你自己的题库 JSON。", `<button class="secondary" id="nextQuestion">换一题</button>`)}<div class="grid grid-2"><div class="card"><span class="badge">${q.subject}</span><h2>${q.q}</h2><div class="quiz-options">${q.options.map((o,i)=>`<button class="quiz-option" data-answer="${i}">${String.fromCharCode(65+i)}. ${esc(o)}</button>`).join('')}</div><p id="quizExplain"></p></div><div class="card"><h3>训练记录</h3><p>已练习：${state.training.history.length} 题</p><p>正确：${state.training.history.filter(x=>x.correct).length} 题</p><p>正确率：${state.training.history.length?Math.round(state.training.history.filter(x=>x.correct).length/state.training.history.length*100):0}%</p><button class="secondary" id="exportTraining">导出训练记录</button></div></div>`;
}

function bindPageEvents() {
  document.getElementById("goToday")?.addEventListener("click",()=>navigate("today"));
  document.getElementById("goPomodoro")?.addEventListener("click",()=>navigate("pomodoro"));
  document.getElementById("importExcel")?.addEventListener("click",()=>document.getElementById("excelInput").click());
  document.getElementById("autoSchedule")?.addEventListener("click", scheduleFromUI);
  document.getElementById("exportAllJson")?.addEventListener("click",()=>downloadJSON(state,"benny-study-backup.json"));
  document.getElementById("importAllJson")?.addEventListener("click",()=>document.getElementById("jsonInput").click());
  document.querySelectorAll(".course-done,.plan-task-check").forEach(cb=>cb.addEventListener("change",()=>{const c=state.courses.find(x=>taskId(x)===cb.dataset.id);if(c)c.done=cb.checked;saveState();render();}));
  document.querySelectorAll(".add-error-from-day").forEach(b=>b.addEventListener("click",()=>{navigate("errors");setTimeout(()=>showErrorForm(null,b.dataset.date),0);}));
  document.getElementById("newError")?.addEventListener("click",()=>showErrorForm());
  document.getElementById("exportErrors")?.addEventListener("click",()=>downloadJSON(state.errors,"benny-errors.json"));
  document.getElementById("importErrors")?.addEventListener("click",()=>{document.getElementById("jsonInput").dataset.mode="errors";document.getElementById("jsonInput").click();});
  document.getElementById("openCloud")?.addEventListener("click",openSettings);
  document.querySelectorAll(".edit-error").forEach(b=>b.addEventListener("click",()=>showErrorForm(Number(b.dataset.index))));
  document.querySelectorAll(".delete-error").forEach(b=>b.addEventListener("click",()=>{if(confirm("删除这条错题吗？")){state.errors.splice(Number(b.dataset.index),1);saveState();render();}}));
  document.getElementById("newWeekly")?.addEventListener("click",()=>{document.getElementById("weeklyFormHost").innerHTML=weeklyForm();document.getElementById("saveWeekly").addEventListener("click",saveWeekly);});
  document.querySelectorAll(".delete-week").forEach(b=>b.addEventListener("click",()=>{state.weekly.splice(Number(b.dataset.index),1);saveState();render();}));
  document.querySelectorAll(".exam-field").forEach(x=>x.addEventListener("change",()=>{state.examNotes[x.dataset.date]??={};state.examNotes[x.dataset.date][x.dataset.key]=x.value;saveState();}));
  document.getElementById("timerToggle")?.addEventListener("click",toggleTimer);
  document.getElementById("timerReset")?.addEventListener("click",()=>resetTimer(timer.total/60));
  document.querySelectorAll(".timerPreset").forEach(b=>b.addEventListener("click",()=>resetTimer(Number(b.dataset.min))));
  document.getElementById("nextQuestion")?.addEventListener("click",()=>{activeQuestion++;render();});
  document.querySelectorAll(".quiz-option").forEach(b=>b.addEventListener("click",answerQuiz));
  document.getElementById("exportTraining")?.addEventListener("click",()=>downloadJSON(state.training.history,"xingce-training.json"));
}
function showErrorForm(index=null,date="") { const host=document.getElementById("errorFormHost");host.innerHTML=errorForm(index,date);document.getElementById("saveError").addEventListener("click",()=>saveError(index));document.getElementById("cancelError").addEventListener("click",()=>host.innerHTML=""); }
function saveError(index) { const value={date:errDate.value,subject:errSubject.value,chapter:errChapter.value,type:errType.value,reason:errReason.value,method:errMethod.value,reviewDate:errReview.value,status:errStatus.value};if(index===null)state.errors.unshift(value);else state.errors[index]=value;saveState();render(); }
function saveWeekly(){state.weekly.unshift({week:weekName.value,hours:weekHours.value,highlights:weekHighlights.value,problems:weekProblems.value,weakness:weekWeakness.value,adjustment:weekAdjustment.value});saveState();render();}

function readSettingsFromUI(){
  ["startDate","baseTarget","baseMax"].forEach(k=>{const el=document.getElementById(`${k}Setting`);if(el)state.settings[k]=el.value;});
  const b=document.getElementById("baseHoursSetting"),l=document.getElementById("laterHoursSetting");if(b)state.settings.baseVideoHours=Number(b.value);if(l)state.settings.laterVideoHours=Number(l.value);
}
function scheduleFromUI(){readSettingsFromUI();autoSchedule();saveState();render();}
function autoSchedule(){
  state.plan=[];state.courses.forEach(c=>{c.planDate="";c.slot="";});let start=state.settings.startDate;
  const configs={基础轮:{preferred:state.settings.baseTarget,max:state.settings.baseMax,hours:state.settings.baseVideoHours},题海轮:{preferred:"2026-09-18",max:"2026-09-25",hours:state.settings.laterVideoHours},突破轮:{preferred:"2026-10-18",max:"2026-10-24",hours:state.settings.laterVideoHours},模拟轮:{preferred:"2026-12-05",max:"2026-12-05",hours:state.settings.laterVideoHours}};
  for(const phase of PHASES){const result=allocatePhase(state.courses.filter(c=>c.phase===phase),start,configs[phase]);state.plan.push(...result.days);start=addDays(result.end,1);}state.plan.sort((a,b)=>a.date.localeCompare(b.date));
}
function allocatePhase(courses,start,config){
  const videos=courses.filter(c=>c.type==='video'),pages=courses.filter(c=>c.type!=='video');const dates=[];for(let d=start;d<=config.max;d=addDays(d,1))if(!isExam(d))dates.push(d);
  const preferredDays=Math.max(1,dates.filter(d=>d<=config.preferred).length);const total=videos.reduce((s,c)=>s+c.minutes/2,0);const target=Math.max(total/preferredDays,config.hours*60);let idx=0;const map=new Map();
  for(const d of dates){if(idx>=videos.length)break;let used=0,arr=[];while(idx<videos.length){const t=videos[idx].minutes/2;if(arr.length&&used+t>target)break;const c=videos[idx++];c.planDate=d;arr.push(c);used+=t;}map.set(d,{date:d,phase:courses[0]?.phase||'',tasks:arr,videoHours:used/60});}
  const pageDates=dates.slice(Math.max(0,dates.length-pages.length));pages.forEach((c,i)=>{const d=pageDates[i%pageDates.length]||dates.at(-1)||start;c.planDate=d;if(!map.has(d))map.set(d,{date:d,phase:c.phase,tasks:[],videoHours:0});map.get(d).tasks.push(c);});
  [...map.values()].forEach(day=>{const video=day.tasks.filter(c=>c.type==='video');const split=Math.ceil(video.length/2);video.forEach((c,i)=>{c.slot=i<split?'morning':'afternoon';});day.tasks.filter(c=>c.type!=='video').forEach(c=>c.slot='afternoon');});
  const days=[...map.values()].sort((a,b)=>a.date.localeCompare(b.date));return{days,end:days.at(-1)?.date||start};
}

async function importExcel(file){
  if(typeof XLSX==='undefined')throw new Error('Excel 解析库未加载，请联网后刷新。');const buf=await file.arrayBuffer();const wb=XLSX.read(buf,{type:'array'});const courses=[];
  PHASES.forEach(phase=>{const ws=wb.Sheets[phase];if(!ws)return;const rows=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});const h=rows[0].map(x=>String(x).trim());const find=names=>names.map(n=>h.indexOf(n)).find(i=>i>=0);const mi=find(['模块']),ci=find(['章节']),ni=find(['课程名称','课程/资源名称','名称']),di=find(['视频时长','时长','原字段']);rows.slice(1).filter(r=>r[ni]).forEach((r,i)=>{const module=String(r[mi]||''),duration=String(r[di]||''),type=module.trim()==='齐麟数资'?'pages':'video';courses.push({id:`${phase}-${i+1}`,phase,module,chapter:String(r[ci]||''),name:String(r[ni]||''),duration,minutes:type==='video'?parseMinutes(duration):0,type,done:false,planDate:'',slot:''});});});
  state.courses=courses;autoSchedule();saveState();render();alert(`成功导入 ${courses.length} 项课程/资源。`);
}
function downloadJSON(data,name){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();URL.revokeObjectURL(a.href);}

function resetTimer(minutes){clearInterval(timer.interval);timer={...timer,remaining:minutes*60,total:minutes*60,running:false};render();}
function toggleTimer(){if(timer.running){clearInterval(timer.interval);timer.running=false;render();return;}timer.running=true;timer.interval=setInterval(()=>{timer.remaining--;if(timer.remaining<=0){clearInterval(timer.interval);timer.running=false;timer.sessions++;timer.remaining=timer.total;alert('这一轮完成啦，起来喝口水吧 🌸');}if(currentPage==='pomodoro')render();},1000);render();}
function answerQuiz(e){const q=QUIZ_BANK[activeQuestion%QUIZ_BANK.length],picked=Number(e.currentTarget.dataset.answer),correct=picked===q.answer;document.querySelectorAll('.quiz-option').forEach((b,i)=>b.classList.add(i===q.answer?'correct':(i===picked?'wrong':'')));document.getElementById('quizExplain').textContent=(correct?'答对啦！':'再看看思路：')+q.explain;state.training.history.push({date:new Date().toISOString(),subject:q.subject,question:q.q,picked,correct});saveState();}

const settingsDialog=document.getElementById('settingsDialog');
function openSettings(){const s=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}');repoInput.value=s.repo||'lingwangshu018/Benny-study';branchInput.value=s.branch||'main';tokenInput.value=s.token||'';cloudPathInput.value=s.path||'data/benny-study-backup.json';settingsDialog.showModal();}
function saveGitSettings(){localStorage.setItem(SETTINGS_KEY,JSON.stringify({repo:repoInput.value.trim(),branch:branchInput.value.trim(),token:tokenInput.value.trim(),path:cloudPathInput.value.trim()}));cloudStatus.textContent='设置已保存到当前浏览器。';}
async function githubRequest(path,options={}){const s=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}');if(!s.token||!s.repo)throw new Error('请先填写仓库和 Fine-grained Token。');const res=await fetch(`https://api.github.com/repos/${s.repo}/${path}`,{...options,headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${s.token}`,'X-GitHub-Api-Version':'2022-11-28',...(options.headers||{})}});if(!res.ok&&res.status!==404)throw new Error((await res.json()).message||`GitHub 请求失败：${res.status}`);return res;}
function utf8ToBase64(str){const bytes=new TextEncoder().encode(str);let bin='';bytes.forEach(b=>bin+=String.fromCharCode(b));return btoa(bin);}
function base64ToUtf8(str){const bin=atob(str.replace(/\n/g,''));const bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));return new TextDecoder().decode(bytes);}
async function pushCloud(){try{saveGitSettings();cloudStatus.textContent='正在备份……';const s=JSON.parse(localStorage.getItem(SETTINGS_KEY));let sha;const old=await githubRequest(`contents/${s.path}?ref=${encodeURIComponent(s.branch)}`);if(old.status!==404)sha=(await old.json()).sha;const body={message:`chore: backup Benny Study ${new Date().toLocaleString()}`,content:utf8ToBase64(JSON.stringify(state,null,2)),branch:s.branch,...(sha?{sha}:{})};await githubRequest(`contents/${s.path}`,{method:'PUT',body:JSON.stringify(body),headers:{'Content-Type':'application/json'}});cloudStatus.textContent='已成功备份到 GitHub。';}catch(e){cloudStatus.textContent=e.message;}}
async function pullCloud(){try{saveGitSettings();cloudStatus.textContent='正在恢复……';const s=JSON.parse(localStorage.getItem(SETTINGS_KEY));const res=await githubRequest(`contents/${s.path}?ref=${encodeURIComponent(s.branch)}`);if(res.status===404)throw new Error('仓库里还没有云存档。');const json=await res.json();state={...clone(DEFAULT_STATE),...JSON.parse(base64ToUtf8(json.content))};saveState();cloudStatus.textContent='恢复成功。';settingsDialog.close();render();}catch(e){cloudStatus.textContent=e.message;}}

function bindGlobal(){
  document.getElementById('settingsButton').addEventListener('click',openSettings);document.getElementById('quickPomodoro').addEventListener('click',()=>navigate('pomodoro'));document.getElementById('saveSettingsButton').addEventListener('click',saveGitSettings);document.getElementById('pushCloudButton').addEventListener('click',pushCloud);document.getElementById('pullCloudButton').addEventListener('click',pullCloud);
  document.getElementById('excelInput').addEventListener('change',e=>{const f=e.target.files[0];if(f)importExcel(f).catch(err=>alert(err.message));e.target.value='';});
  document.getElementById('jsonInput').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{const data=JSON.parse(await f.text());if(e.target.dataset.mode==='errors')state.errors=Array.isArray(data)?data:[];else state={...clone(DEFAULT_STATE),...data};saveState();render();}catch{alert('JSON 文件无法读取。');}e.target.value='';e.target.dataset.mode='';});
}
setupNav();bindGlobal();render();
