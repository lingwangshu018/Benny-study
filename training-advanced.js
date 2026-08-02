// Benny Study · Training Center v2：数字推理与思维训练
(function () {
  state.training ||= { history: [] };
  state.training.history ||= [];
  state.training.settings ||= { questionCount: 20 };

  const TYPES = {
    arithmetic: [
      ["two-add-sub","两位数加减","两位数加减混合"], ["three-add-sub","三位数加减","三位数加减混合"],
      ["multi-add","多数相加","3—5 个数连续相加"], ["multiply","乘法速算","两位数乘一位数或整十数"],
      ["divide-estimate","除法估算","常见整除与近似商"], ["percent","百分数换算","小数与百分数互换"]
    ],
    reasoning: [
      ["basic-sequence","基础数列","等差、等比与交替变化"], ["multi-level","多级数列","先作差再寻找规律"],
      ["power-sequence","幂次数列","平方、立方及其变式"], ["recursive-sequence","递推数列","前项推导后项"],
      ["fraction-sequence","分数数列","分子分母分别找规律"], ["periodic-sequence","周期数列","识别循环变化规律"]
    ],
    thinking: [
      ["schulte","舒尔特方格","按顺序快速点击数字"], ["memory","瞬间记忆","短暂观察后复原数字"],
      ["twenty-four","24 点","用四个数字计算得到 24"], ["stroop","斯特鲁普","忽略文字含义，判断字体颜色"]
    ]
  };

  let view = "hall", category = null, type = null, session = null, result = null;
  let gameTimer = null;
  const rand = (a,b) => Math.floor(Math.random()*(b-a+1))+a;
  const pick = a => a[rand(0,a.length-1)];
  const shuffle = a => [...a].sort(()=>Math.random()-.5);
  const nowLabel = () => new Date().toISOString().slice(0,16).replace("T"," ");

  function stats(){ const h=state.training.history; const total=h.reduce((s,x)=>s+Number(x.total||0),0), correct=h.reduce((s,x)=>s+Number(x.correct||0),0); return { sessions:h.length,total,accuracy:total?Math.round(correct/total*100):0 }; }
  function saveResult(r){ state.training.history.push(r); saveState(); result=r; view="result"; clearInterval(gameTimer); render(); }
  function typeTitle(cat,id){ return TYPES[cat]?.find(x=>x[0]===id)?.[1] || id; }

  function genArithmetic(id){
    if(id==="two-add-sub"){const a=rand(12,99),b=rand(11,89),op=Math.random()>.5?"+":"−";return op==="+"?{text:`${a} + ${b}`,answer:a+b}:{text:`${Math.max(a,b)} − ${Math.min(a,b)}`,answer:Math.abs(a-b)};}
    if(id==="three-add-sub"){const a=rand(120,999),b=rand(101,899),op=Math.random()>.5?"+":"−";return op==="+"?{text:`${a} + ${b}`,answer:a+b}:{text:`${Math.max(a,b)} − ${Math.min(a,b)}`,answer:Math.abs(a-b)};}
    if(id==="multi-add"){const ns=Array.from({length:rand(3,5)},()=>rand(12,199));return{text:ns.join(" + "),answer:ns.reduce((a,b)=>a+b,0)};}
    if(id==="multiply"){const a=rand(12,99),b=Math.random()>.5?rand(2,9):pick([10,20,30,40,50]);return{text:`${a} × ${b}`,answer:a*b};}
    if(id==="divide-estimate"){const b=rand(2,12),q=rand(4,99);return{text:`${b*q} ÷ ${b}`,answer:q};}
    const pairs=[[0.1,10],[0.125,12.5],[0.2,20],[0.25,25],[0.4,40],[0.5,50],[0.625,62.5],[0.75,75],[0.8,80]],p=pick(pairs);return{text:`${p[0]} = ?%`,answer:p[1],suffix:"%"};
  }
  function genReasoning(id){
    if(id==="basic-sequence"){if(Math.random()>.5){const s=rand(1,20),d=rand(2,12),arr=Array.from({length:5},(_,i)=>s+i*d);return{text:`${arr.join("，")}，？`,answer:s+5*d};}const s=rand(1,5),r=rand(2,4),arr=Array.from({length:5},(_,i)=>s*r**i);return{text:`${arr.join("，")}，？`,answer:s*r**5};}
    if(id==="multi-level"){const a=rand(1,10),d=rand(1,5),inc=rand(1,4),arr=[a];let diff=d;for(let i=1;i<5;i++){arr.push(arr.at(-1)+diff);diff+=inc;}return{text:`${arr.join("，")}，？`,answer:arr.at(-1)+diff};}
    if(id==="power-sequence"){const k=rand(0,3),arr=Array.from({length:5},(_,i)=>(i+1)**2+k);return{text:`${arr.join("，")}，？`,answer:36+k};}
    if(id==="recursive-sequence"){const a=rand(1,6),b=rand(2,8),arr=[a,b];while(arr.length<5)arr.push(arr.at(-1)+arr.at(-2));return{text:`${arr.join("，")}，？`,answer:arr.at(-1)+arr.at(-2)};}
    if(id==="fraction-sequence"){const n=rand(1,4),arr=Array.from({length:5},(_,i)=>`${n+i}/${n+i+1}`);return{text:`${arr.join("，")}，？（填分子）`,answer:n+5,suffix:`/${n+6}`};}
    const pattern=shuffle([rand(1,9),rand(10,19),rand(20,29)]),arr=Array.from({length:7},(_,i)=>pattern[i%3]);return{text:`${arr.join("，")}，？`,answer:pattern[1]};
  }

  function renderHall(){const s=stats();return `${sectionHead("行测训练室","专项训练计算速度、数字推理、注意力与工作记忆。")}
    <section class="training-summary"><div><span>累计训练</span><strong>${s.sessions} 次</strong></div><div><span>累计题量</span><strong>${s.total} 题</strong></div><div><span>综合正确率</span><strong>${s.accuracy}%</strong></div></section>
    <section class="training-hall">
      ${[["arithmetic","🧮","计算能力","基础运算与资料分析速算"],["reasoning","🔢","数字推理","数列规律与递推"],["thinking","🧠","思维能力","注意力、记忆与反应"],["data","📊","资料分析专项","增长率、比重与平均数（下一批）"]].map(([id,icon,title,desc])=>`<button class="training-zone ${id}" data-v2-category="${id}" type="button"><span class="training-zone-icon">${icon}</span><span><strong>${title}</strong><small>${desc}</small></span><em>${TYPES[id]?.length?`${TYPES[id].length} 项可训练`:"即将开放"}</em></button>`).join("")}
    </section>
    <section class="training-history-card"><header><div><h3>最近训练</h3><p>每一次练习都会进入统计与复盘。</p></div><button class="secondary" id="exportTrainingV3">导出记录</button></header><div class="training-history-list">${state.training.history.slice(-8).reverse().map(x=>`<div class="training-history-row"><span>🧠</span><div><strong>${esc(x.title||"专项训练")}</strong><small>${esc(x.date||"")} · ${x.correct||0}/${x.total||0} · ${x.accuracy||0}%</small></div><b>${x.durationSeconds||0} 秒</b></div>`).join("")||`<div class="training-empty">还没有训练记录，开始第一轮吧 🐰</div>`}</div></section>`;}
  function renderCategory(){const title=category==="arithmetic"?"🧮 计算能力":category==="reasoning"?"🔢 数字推理":"🧠 思维能力";return `${sectionHead(title,"选择一个专项开始练习。",`<button class="secondary" id="v2BackHall">← 返回大厅</button>`)}<section class="training-type-grid">${(TYPES[category]||[]).map(([id,t,d])=>`<button class="training-type-card" data-v2-type="${id}" type="button"><span>✦</span><strong>${t}</strong><small>${d}</small></button>`).join("")||`<div class="training-empty">这一分区稍后继续补充。</div>`}</section>`;}
  function renderSetup(){const t=typeTitle(category,type), thinking=category==="thinking";return `${sectionHead(t,"设置训练参数后开始。",`<button class="secondary" id="v2BackCategory">← 返回</button>`)}<section class="training-setup-card"><div class="training-setup-art">${thinking?"🧠🐰":"🔢🐰"}</div><div class="training-setup-options"><h3>训练设置</h3>${thinking&&type==="schulte"?`<label>方格大小<select id="v2Count"><option value="16">4 × 4</option><option value="25">5 × 5</option></select></label>`:thinking&&type==="memory"?`<label>记忆位数<select id="v2Count"><option value="4">4 位</option><option value="6">6 位</option><option value="8">8 位</option></select></label>`:`<label>题量<select id="v2Count">${[10,20,30,50].map(n=>`<option value="${n}">${n} 题</option>`).join("")}</select></label>`}<p>${thinking?"完成后会记录耗时、正确率和表现。":"键盘输入答案，回车提交。"}</p><button class="primary" id="v2Start">开始训练</button></div></section>`;}

  function start(){const count=Number(document.getElementById("v2Count")?.value||10);if(category==="thinking")return startThinking(count);const gen=category==="reasoning"?genReasoning:genArithmetic;session={title:typeTitle(category,type),questions:Array.from({length:count},()=>gen(type)),index:0,correct:0,answers:[],startedAt:Date.now()};view="session";render();}
  function renderSession(){const q=session.questions[session.index],pct=Math.round(session.index/session.questions.length*100);return `<section class="training-session"><header><button class="secondary" id="v2Quit">结束训练</button><div><strong>${esc(session.title)}</strong><small>第 ${session.index+1} / ${session.questions.length} 题</small></div><span>${pct}%</span></header><div class="training-session-progress"><i style="width:${pct}%"></i></div><article class="training-question-card"><span class="training-question-label">请作答</span><div class="training-question">${esc(q.text)}</div><div class="training-answer-row"><input id="v2Answer" inputmode="decimal" autocomplete="off" placeholder="输入答案"><span>${esc(q.suffix||"")}</span><button class="primary" id="v2Submit">提交</button></div><p id="v2Feedback" class="training-feedback"></p></article></section>`;}
  function submit(){const q=session.questions[session.index],el=document.getElementById("v2Answer"),v=Number(el.value.trim());if(!Number.isFinite(v))return el.focus();const ok=Math.abs(v-Number(q.answer))<.0001;if(ok)session.correct++;session.answers.push({question:q.text,answer:q.answer,userAnswer:v,correct:ok});const fb=document.getElementById("v2Feedback");fb.textContent=ok?"答对啦 ✨":`正确答案：${q.answer}${q.suffix||""}`;fb.className=`training-feedback ${ok?"ok":"wrong"}`;setTimeout(()=>{session.index++;session.index>=session.questions.length?finishStandard():render();},420);}
  function finishStandard(){const sec=Math.max(1,Math.round((Date.now()-session.startedAt)/1000)),r={id:`training-${Date.now()}`,date:nowLabel(),category,type,title:session.title,total:session.questions.length,correct:session.correct,accuracy:Math.round(session.correct/session.questions.length*100),durationSeconds:sec,avgSeconds:Number((sec/session.questions.length).toFixed(1)),answers:session.answers};saveResult(r);}

  function startThinking(count){if(type==="schulte"){session={kind:"schulte",title:"舒尔特方格",count,numbers:shuffle(Array.from({length:count},(_,i)=>i+1)),next:1,startedAt:Date.now()};view="thinking";render();return;}if(type==="memory"){const digits=Array.from({length:count},()=>rand(0,9)).join("");session={kind:"memory",title:"瞬间记忆",digits,phase:"show",startedAt:Date.now()};view="thinking";render();setTimeout(()=>{if(session?.kind==="memory"){session.phase="answer";render();}},2200);return;}if(type==="twenty-four"){session={kind:"twenty-four",title:"24 点",numbers:[rand(1,9),rand(1,9),rand(1,9),rand(1,9)],startedAt:Date.now()};view="thinking";render();return;}session={kind:"stroop",title:"斯特鲁普",round:0,total:20,correct:0,startedAt:Date.now(),current:stroopItem()};view="thinking";render();}
  function stroopItem(){const colors=[['红','red'],['蓝','blue'],['绿','green'],['黄','goldenrod']];const word=pick(colors),ink=pick(colors);return{word:word[0],ink:ink[1],answer:ink[0]};}
  function renderThinking(){if(session.kind==="schulte")return `<section class="mind-card"><header><button class="secondary" id="v2Quit">结束训练</button><div><strong>舒尔特方格</strong><small>请从 1 开始依次点击</small></div><b>下一个：${session.next}</b></header><div class="schulte-grid" style="--grid:${Math.sqrt(session.count)}">${session.numbers.map(n=>`<button data-schulte="${n}">${n}</button>`).join("")}</div></section>`;
    if(session.kind==="memory")return `<section class="mind-card memory-card"><header><button class="secondary" id="v2Quit">结束训练</button><strong>瞬间记忆</strong></header>${session.phase==="show"?`<div class="memory-number">${session.digits}</div><p>记住这串数字……</p>`:`<div class="memory-answer"><p>刚才的数字是什么？</p><input id="memoryInput" inputmode="numeric" maxlength="${session.digits.length}"><button class="primary" id="memorySubmit">提交</button></div>`}</section>`;
    if(session.kind==="twenty-four")return `<section class="mind-card"><header><button class="secondary" id="v2Quit">结束训练</button><strong>24 点</strong></header><div class="twenty-four-numbers">${session.numbers.map(n=>`<span>${n}</span>`).join("")}</div><p>使用 + − × ÷ 和括号，使结果等于 24。</p><input id="twentyFourInput" placeholder="例如：(8-2)×(3+1)"><div class="toolbar"><button class="primary" id="twentyFourSubmit">验证</button><button class="secondary" id="twentyFourSkip">换一题</button></div><p id="twentyFourFeedback"></p></section>`;
    const c=session.current;return `<section class="mind-card"><header><button class="secondary" id="v2Quit">结束训练</button><div><strong>斯特鲁普</strong><small>${session.round+1}/${session.total}</small></div></header><p>请选择下面文字的<strong>字体颜色</strong>，不要读文字。</p><div class="stroop-word" style="color:${c.ink}">${c.word}</div><div class="stroop-options">${['红','蓝','绿','黄'].map(x=>`<button data-stroop="${x}">${x}</button>`).join("")}</div></section>`;}
  function finishMind(correct,total,title){const sec=Math.max(1,Math.round((Date.now()-session.startedAt)/1000));saveResult({id:`training-${Date.now()}`,date:nowLabel(),category:"thinking",type,title,total,correct,accuracy:Math.round(correct/total*100),durationSeconds:sec,avgSeconds:Number((sec/total).toFixed(1))});}
  function renderResult(){const r=result;return `${sectionHead("训练完成","结果已自动保存。")}<section class="training-result-card"><div class="training-result-medal">${r.accuracy>=90?"🏆":r.accuracy>=70?"🌟":"🌱"}</div><h2>${esc(r.title)}</h2><div class="training-result-stats"><div><span>正确</span><strong>${r.correct}/${r.total}</strong></div><div><span>正确率</span><strong>${r.accuracy}%</strong></div><div><span>总耗时</span><strong>${r.durationSeconds} 秒</strong></div><div><span>平均</span><strong>${r.avgSeconds} 秒</strong></div></div><div class="training-result-actions"><button class="primary" id="v2Again">再练一次</button><button class="secondary" id="v2ResultHall">返回大厅</button></div></section>`;}

  window.renderAptitude=function(){if(view==="category")return renderCategory();if(view==="setup")return renderSetup();if(view==="session")return renderSession();if(view==="thinking")return renderThinking();if(view==="result")return renderResult();return renderHall();};
  const oldBind=bindPageEvents;bindPageEvents=function(){oldBind();document.querySelectorAll('[data-v2-category]').forEach(b=>b.onclick=()=>{category=b.dataset.v2Category;view="category";render();});document.querySelectorAll('[data-v2-type]').forEach(b=>b.onclick=()=>{type=b.dataset.v2Type;view="setup";render();});document.getElementById('v2BackHall')?.addEventListener('click',()=>{view="hall";render();});document.getElementById('v2BackCategory')?.addEventListener('click',()=>{view="category";render();});document.getElementById('v2Start')?.addEventListener('click',start);document.getElementById('v2Submit')?.addEventListener('click',submit);document.getElementById('v2Answer')?.addEventListener('keydown',e=>{if(e.key==='Enter')submit();});document.getElementById('v2Answer')?.focus();document.getElementById('v2Quit')?.addEventListener('click',()=>{if(confirm('结束本次训练吗？')){clearInterval(gameTimer);view="hall";session=null;render();}});document.getElementById('v2Again')?.addEventListener('click',()=>{view="setup";render();});document.getElementById('v2ResultHall')?.addEventListener('click',()=>{view="hall";render();});document.getElementById('exportTrainingV3')?.addEventListener('click',()=>downloadJSON(state.training.history,'benny-training-history.json'));
    document.querySelectorAll('[data-schulte]').forEach(b=>b.onclick=()=>{const n=Number(b.dataset.schulte);if(n!==session.next){b.classList.add('wrong');setTimeout(()=>b.classList.remove('wrong'),180);return;}b.classList.add('done');session.next++;if(session.next>session.count)finishMind(session.count,session.count,'舒尔特方格');});
    document.getElementById('memorySubmit')?.addEventListener('click',()=>{const ok=document.getElementById('memoryInput').value===session.digits;finishMind(ok?1:0,1,'瞬间记忆');});
    document.getElementById('twentyFourSubmit')?.addEventListener('click',()=>{const expr=document.getElementById('twentyFourInput').value.trim();const fb=document.getElementById('twentyFourFeedback');try{if(!/^[0-9+\-*/().×÷\s]+$/.test(expr))throw 0;const used=(expr.match(/\d+/g)||[]).map(Number).sort((a,b)=>a-b),need=[...session.numbers].sort((a,b)=>a-b);if(JSON.stringify(used)!==JSON.stringify(need))throw 0;const val=Function(`'use strict';return (${expr.replace(/×/g,'*').replace(/÷/g,'/')})`)();if(Math.abs(val-24)<1e-8)finishMind(1,1,'24 点');else fb.textContent=`结果是 ${val}，再试试。`;}catch{fb.textContent='请只使用给出的四个数字和 + − × ÷ 括号。';}});document.getElementById('twentyFourSkip')?.addEventListener('click',()=>{session.numbers=[rand(1,9),rand(1,9),rand(1,9),rand(1,9)];session.startedAt=Date.now();render();});
    document.querySelectorAll('[data-stroop]').forEach(b=>b.onclick=()=>{if(b.dataset.stroop===session.current.answer)session.correct++;session.round++;if(session.round>=session.total)finishMind(session.correct,session.total,'斯特鲁普');else{session.current=stroopItem();render();}});
  };
})();