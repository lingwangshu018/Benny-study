// Benny Study · 完整课程库页面 v0.1
(function(){
  let filters={phase:"全部",status:"全部",query:""};
  function filtered(){return state.courses.filter(c=>{
    const phaseOK=filters.phase==="全部"||c.phase===filters.phase;
    const statusOK=filters.status==="全部"||(filters.status==="已完成"?c.done:!c.done);
    const q=filters.query.trim().toLowerCase();
    const queryOK=!q||[c.module,c.chapter,c.name,c.phase].some(x=>String(x||"").toLowerCase().includes(q));
    return phaseOK&&statusOK&&queryOK;
  });}
  function stats(){const total=state.courses.length,done=state.courses.filter(c=>c.done).length,remain=Math.max(0,total-done),today=state.courses.filter(c=>c.planDate===dateISO(new Date())).length;return {total,done,remain,today};}
  function card(c){const id=esc(taskId(c));return `<article class="course-card ${c.done?'done':''}">
    <input class="course-done course-check" data-id="${id}" type="checkbox" ${c.done?'checked':''} aria-label="完成 ${esc(c.name)}">
    <div><div class="course-meta"><span class="course-chip">${esc(c.phase)}</span><span class="course-chip">${esc(c.type==='pages'?'刷题/页数':'视频/训练')}</span></div><h3>${esc(c.name)}</h3><p><b>${esc(c.module||'未分类')}</b>${c.chapter?` · ${esc(c.chapter)}`:''}${c.duration?` · ${esc(c.duration)}`:''}</p></div>
    <span class="course-date">${c.planDate||'待排期'}</span></article>`;}
  renderCourses=function renderCourses(){const s=stats(),list=filtered();return `<section class="courses-shell">
    <div class="courses-hero"><div><span class="badge">📚 一节都不会丢</span><h1>完整课程库</h1><p>按阶段、完成状态或关键词查找课程。导入 Excel 后，所有课程都会保留并参与自动排课。</p></div><div class="courses-hero-art">🐰📖🦁</div></div>
    <div class="courses-stats"><div class="course-stat"><span>全部课程</span><strong>${s.total}</strong></div><div class="course-stat"><span>已经完成</span><strong>${s.done}</strong></div><div class="course-stat"><span>剩余课程</span><strong>${s.remain}</strong></div><div class="course-stat"><span>今日安排</span><strong>${s.today}</strong></div></div>
    <div class="courses-toolbar"><label>搜索课程<input id="courseSearch" value="${esc(filters.query)}" placeholder="模块、章节或课程名"></label><label>阶段<select id="coursePhase"><option>全部</option>${PHASES.map(p=>`<option ${filters.phase===p?'selected':''}>${p}</option>`).join('')}</select></label><label>状态<select id="courseStatus"><option>全部</option><option ${filters.status==='未完成'?'selected':''}>未完成</option><option ${filters.status==='已完成'?'selected':''}>已完成</option></select></label><button class="primary" id="importExcel">导入 Excel</button><button class="secondary" id="autoSchedule">自动排课</button></div>
    <div class="course-list">${list.length?list.map(card).join(''):`<div class="courses-empty">没有符合条件的课程。换一个筛选条件试试吧 🌱</div>`}</div>
    <div class="toolbar"><button class="secondary" id="exportAllJson">导出全部存档</button><button class="secondary" id="importAllJson">导入存档</button></div>
  </section>`;};
  document.addEventListener('input',e=>{if(e.target.id==='courseSearch'){filters.query=e.target.value;render();}});
  document.addEventListener('change',e=>{if(e.target.id==='coursePhase'){filters.phase=e.target.value;render();}if(e.target.id==='courseStatus'){filters.status=e.target.value;render();}});
})();