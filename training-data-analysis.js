// Benny Study · 资料分析专项训练
(function () {
  let dataUi = { active: false, view: "category", type: null, session: null, result: null };
  const originalRenderAptitude = window.renderAptitude;

  const TYPES = [
    ["growth-rate","增长率","已知现期量和基期量，计算增长率", genGrowthRate],
    ["base-value","基期量","已知现期量和增长率，计算基期量", genBaseValue],
    ["growth-amount","增长量","已知现期量和增长率，计算增长量", genGrowthAmount],
    ["proportion","比重","部分量 ÷ 整体量", genProportion],
    ["average","平均数","总量 ÷ 份数", genAverage],
    ["annual-rate","年均增长率","按两期总增长估算年均增速", genAnnualRate],
    ["fraction-compare","分数比较","比较两个分数大小", genFractionCompare]
  ];

  function rand(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
  function pick(a){ return a[rand(0,a.length-1)]; }
  function q(text,answer,suffix="",tolerance=.15){ return { text, answer:Number(answer), suffix, tolerance }; }
  function round1(n){ return Math.round(n*10)/10; }

  function genGrowthRate(){ const base=rand(80,500), rate=pick([5,8,10,12,15,20,25,30,40]); const now=round1(base*(1+rate/100)); return q(`基期量 ${base}，现期量 ${now}，增长率约为`, rate, "%", .2); }
  function genBaseValue(){ const rate=pick([5,10,12.5,20,25,50]); const base=rand(80,500); const now=round1(base*(1+rate/100)); return q(`现期量 ${now}，增长率 ${rate}%，基期量约为`, base, "", .6); }
  function genGrowthAmount(){ const rate=pick([5,10,20,25,50]); const base=rand(80,500); const now=round1(base*(1+rate/100)); return q(`现期量 ${now}，增长率 ${rate}%，增长量约为`, round1(now-base), "", .6); }
  function genProportion(){ const total=rand(200,1200), pct=pick([10,15,20,25,30,40,50,60]); const part=round1(total*pct/100); return q(`部分量 ${part}，整体量 ${total}，比重约为`, pct, "%", .2); }
  function genAverage(){ const n=rand(3,12), avg=rand(20,180), total=n*avg; return q(`总量 ${total}，共 ${n} 个单位，平均数为`, avg, "", .1); }
  function genAnnualRate(){ const years=pick([2,3,4,5]); const rate=pick([5,10,15,20]); const base=100; const end=Math.round(base*Math.pow(1+rate/100,years)); return q(`${years} 年前为 ${base}，现在约为 ${end}，年均增长率约为`, rate, "%", 1.2); }
  function genFractionCompare(){ const a=rand(10,90),b=rand(11,99),c=rand(10,90),d=rand(11,99); const ans=a/b>c/d?1:2; return q(`比较 ${a}/${b} 与 ${c}/${d}，较大的是第几个？`, ans, "", 0); }

  function getType(id){ const row=TYPES.find(x=>x[0]===id); return row && {id:row[0],title:row[1],desc:row[2],gen:row[3]}; }
  function count(){ return Number(state.training?.settings?.questionCount || 20); }

  function renderCategory(){
    return `${sectionHead("📊 资料分析专项", "围绕资料分析最常用的速算模型进行短时、重复训练。", `<button class="secondary" id="dataBackHall">← 返回训练大厅</button>`)}
      <section class="training-type-grid">${TYPES.map(x=>`<button class="training-type-card data-type-card" data-data-type="${x[0]}" type="button"><span>📈</span><strong>${x[1]}</strong><small>${x[2]}</small></button>`).join("")}</section>`;
  }
  function renderSetup(){ const item=getType(dataUi.type); return `${sectionHead(item.title,item.desc,`<button class="secondary" id="dataBackCategory">← 返回资料分析专项</button>`)}
    <section class="training-setup-card"><div class="training-setup-art">📊🐰</div><div class="training-setup-options"><h3>训练设置</h3><label>题量<select id="dataQuestionCount">${[10,20,30,50].map(n=>`<option value="${n}" ${n===count()?"selected":""}>${n} 题</option>`).join("")}</select></label><p>默认答案保留 1 位小数；百分数题直接输入数字，不用输入 %。</p><button class="primary" id="dataStart">开始训练</button></div></section>`; }
  function start(){ const item=getType(dataUi.type), n=Number(document.getElementById("dataQuestionCount")?.value||20); state.training.settings.questionCount=n; saveState(); dataUi.session={title:item.title,questions:Array.from({length:n},()=>item.gen()),index:0,correct:0,answers:[],startedAt:Date.now()}; dataUi.view="session"; render(); }
  function renderSession(){ const s=dataUi.session,q=s.questions[s.index],pct=Math.round(s.index/s.questions.length*100); return `<section class="training-session"><header><button class="secondary" id="dataQuit">结束训练</button><div><strong>${esc(s.title)}</strong><small>第 ${s.index+1} / ${s.questions.length} 题</small></div><span>${pct}%</span></header><div class="training-session-progress"><i style="width:${pct}%"></i></div><article class="training-question-card"><span class="training-question-label">资料分析速算</span><div class="training-question data-question">${esc(q.text)}</div><div class="training-answer-row"><input id="dataAnswer" inputmode="decimal" autocomplete="off" placeholder="输入答案"><span>${esc(q.suffix||"")}</span><button class="primary" id="dataSubmit">提交</button></div><p id="dataFeedback" class="training-feedback"></p></article></section>`; }
  function submit(){ const s=dataUi.session,q=s.questions[s.index],input=document.getElementById("dataAnswer"),value=Number(input.value.trim()); if(!Number.isFinite(value)){input.focus();return;} const ok=Math.abs(value-q.answer)<=q.tolerance; if(ok)s.correct++; s.answers.push({question:q.text,answer:q.answer,userAnswer:value,correct:ok}); const f=document.getElementById("dataFeedback"); f.textContent=ok?"答对啦 ✨":`正确答案约为 ${q.answer}${q.suffix||""}`; f.className=`training-feedback ${ok?"ok":"wrong"}`; setTimeout(()=>{s.index++; s.index>=s.questions.length?finish():render();},420); }
  function finish(){ const s=dataUi.session,durationSeconds=Math.max(1,Math.round((Date.now()-s.startedAt)/1000)); const r={id:`training-${Date.now()}`,date:new Date().toISOString().slice(0,16).replace("T"," "),category:"data",type:dataUi.type,title:s.title,total:s.questions.length,correct:s.correct,accuracy:Math.round(s.correct/s.questions.length*100),durationSeconds,avgSeconds:Number((durationSeconds/s.questions.length).toFixed(1)),answers:s.answers}; state.training.history.push(r); saveState(); dataUi.result=r; dataUi.view="result"; render(); }
  function renderResult(){ const r=dataUi.result; return `${sectionHead("训练完成","本次资料分析专项已保存到训练历史。")}<section class="training-result-card"><div class="training-result-medal">${r.accuracy>=90?"🏆":r.accuracy>=70?"🌟":"🌱"}</div><h2>${esc(r.title)}</h2><div class="training-result-stats"><div><span>正确</span><strong>${r.correct}/${r.total}</strong></div><div><span>正确率</span><strong>${r.accuracy}%</strong></div><div><span>总耗时</span><strong>${r.durationSeconds} 秒</strong></div><div><span>平均每题</span><strong>${r.avgSeconds} 秒</strong></div></div><div class="training-result-actions"><button class="primary" id="dataAgain">再练一次</button><button class="secondary" id="dataResultHall">返回大厅</button></div></section>`; }

  window.renderAptitude=function(){ if(!dataUi.active) return originalRenderAptitude(); if(dataUi.view==="setup")return renderSetup(); if(dataUi.view==="session")return renderSession(); if(dataUi.view==="result")return renderResult(); return renderCategory(); };
  const originalBind=bindPageEvents;
  bindPageEvents=function(){ originalBind(); document.querySelectorAll('[data-training-category="data"]').forEach(b=>b.addEventListener("click",()=>{dataUi.active=true;dataUi.view="category";render();})); document.querySelectorAll("[data-data-type]").forEach(b=>b.addEventListener("click",()=>{dataUi.type=b.dataset.dataType;dataUi.view="setup";render();})); document.getElementById("dataBackHall")?.addEventListener("click",()=>{dataUi.active=false;render();}); document.getElementById("dataBackCategory")?.addEventListener("click",()=>{dataUi.view="category";render();}); document.getElementById("dataStart")?.addEventListener("click",start); document.getElementById("dataSubmit")?.addEventListener("click",submit); document.getElementById("dataAnswer")?.addEventListener("keydown",e=>{if(e.key==="Enter")submit();}); document.getElementById("dataAnswer")?.focus(); document.getElementById("dataQuit")?.addEventListener("click",()=>{if(confirm("结束本次训练吗？当前进度不会保存。")){dataUi.active=false;dataUi.session=null;render();}}); document.getElementById("dataAgain")?.addEventListener("click",()=>{dataUi.view="setup";render();}); document.getElementById("dataResultHall")?.addEventListener("click",()=>{dataUi.active=false;render();}); };
})();