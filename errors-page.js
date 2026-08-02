// Benny Study · 错题库增强版 v0.2
(function(){
  const flowerMap={"言语理解":"🌸","判断推理":"🌷","数量关系":"🌻","资料分析":"🌼","常识":"🪻","申论":"🌹"};
  let filters={keyword:"",subject:"全部",status:"全部",favorite:"全部"};
  let editingIndex=null;

  function norm(e={}){
    return {
      id:e.id||`err-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      date:e.date||dateISO(new Date()), subject:e.subject||e.module||"资料分析",
      chapter:e.chapter||e.topic||"", source:e.source||"", question:e.question||e.title||"",
      myAnswer:e.myAnswer||"", correctAnswer:e.correctAnswer||"", type:e.type||"方法不会",
      reason:e.reason||"", method:e.method||e.knowledge||"", reviewDate:e.reviewDate||addDays(dateISO(new Date()),3),
      reviewCount:Number(e.reviewCount||0), status:e.status||"待复习", favorite:Boolean(e.favorite),
      createdAt:e.createdAt||new Date().toISOString(), lastReviewedAt:e.lastReviewedAt||""
    };
  }
  function normalizeAll(){ state.errors=(state.errors||[]).map(norm); saveState(); }
  function filtered(){
    const k=filters.keyword.trim().toLowerCase();
    return state.errors.filter(e=>{
      const hay=[e.subject,e.chapter,e.source,e.question,e.reason,e.method,e.type].join(" ").toLowerCase();
      return (!k||hay.includes(k))&&(filters.subject==="全部"||e.subject===filters.subject)&&(filters.status==="全部"||e.status===filters.status)&&(filters.favorite==="全部"||(filters.favorite==="收藏"&&e.favorite));
    });
  }
  function option(values,current){return values.map(v=>`<option ${v===current?"selected":""}>${v}</option>`).join("")}
  function editor(e=norm(),index=null){
    return `<section class="error-editor"><h2>${index===null?"新增错题":"编辑错题"}</h2><div class="error-editor-grid">
      <label>日期<input id="eeDate" type="date" value="${esc(e.date)}"></label>
      <label>模块<select id="eeSubject">${option(["言语理解","判断推理","数量关系","资料分析","常识","申论"],e.subject)}</select></label>
      <label>章节/题型<input id="eeChapter" value="${esc(e.chapter)}"></label>
      <label>来源<input id="eeSource" value="${esc(e.source)}" placeholder="教材、粉笔、模考等"></label>
      <label class="wide">题目/简述<textarea id="eeQuestion">${esc(e.question)}</textarea></label>
      <label>我的答案<input id="eeMyAnswer" value="${esc(e.myAnswer)}"></label>
      <label>正确答案<input id="eeCorrectAnswer" value="${esc(e.correctAnswer)}"></label>
      <label>错误类型<select id="eeType">${option(["概念不清","方法不会","审题错误","计算错误","时间不足","粗心","其他"],e.type)}</select></label>
      <label>复习日期<input id="eeReviewDate" type="date" value="${esc(e.reviewDate)}"></label>
      <label class="wide">错误原因<textarea id="eeReason">${esc(e.reason)}</textarea></label>
      <label class="wide">正确方法/知识点<textarea id="eeMethod">${esc(e.method)}</textarea></label>
      <label>状态<select id="eeStatus">${option(["待复习","复习中","已掌握"],e.status)}</select></label>
      <label>收藏<select id="eeFavorite">${option(["否","是"],e.favorite?"是":"否")}</select></label>
    </div><div class="error-editor-actions"><button class="secondary" id="cancelErrorEdit" type="button">取消</button><button class="primary" id="saveErrorEdit" type="button">保存错题</button></div></section>`;
  }
  function card(e,index){
    const flower=flowerMap[e.subject]||"🌱";
    return `<article class="error-card ${e.status==="已掌握"?"is-mastered":""}"><div class="error-card-head"><div class="error-card-title"><span class="error-flower">${flower}</span><div><h3>${esc(e.subject)} · ${esc(e.chapter||"未分类")}</h3><small>${esc(e.date)}${e.source?` · ${esc(e.source)}`:""}</small></div></div><button class="error-star" data-error-star="${index}" type="button">${e.favorite?"⭐":"☆"}</button></div>
    <div class="error-card-tags"><span class="error-tag">${esc(e.type)}</span><span class="error-tag status">${esc(e.status)}</span><span class="error-tag">复习 ${e.reviewCount||0} 次</span></div>
    <div class="error-card-body">${e.question?`<div class="error-line"><b>题目</b>${esc(e.question)}</div>`:""}${e.reason?`<div class="error-line"><b>错误原因</b>${esc(e.reason)}</div>`:""}${e.method?`<div class="error-line"><b>正确方法</b>${esc(e.method)}</div>`:""}</div>
    <div class="error-card-footer"><small>下次复习：${esc(e.reviewDate||"未设置")}</small><div class="error-card-buttons"><button class="secondary" data-error-review="${index}" type="button">复习 +1</button><button class="secondary" data-error-edit="${index}" type="button">编辑</button><button class="danger" data-error-delete="${index}" type="button">删除</button></div></div></article>`;
  }
  function exportErrorsJson(){
    const blob=new Blob([JSON.stringify({version:2,errors:state.errors},null,2)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`Benny-study-错题库-${dateISO(new Date())}.json`;a.click();URL.revokeObjectURL(a.href);
  }
  function exportErrorsExcel(){
    if(typeof XLSX==="undefined"){alert("Excel 导出库未加载，请联网后刷新。");return;}
    const rows=state.errors.map(e=>({日期:e.date,模块:e.subject,章节:e.chapter,来源:e.source,题目:e.question,我的答案:e.myAnswer,正确答案:e.correctAnswer,错误类型:e.type,错误原因:e.reason,正确方法:e.method,复习日期:e.reviewDate,复习次数:e.reviewCount,状态:e.status,收藏:e.favorite?"是":"否"}));
    const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),"错题库");XLSX.writeFile(wb,`Benny-study-错题库-${dateISO(new Date())}.xlsx`);
  }
  function importErrorsFile(file){
    const ext=file.name.split(".").pop().toLowerCase();
    if(ext==="json"){
      const reader=new FileReader();reader.onload=()=>{try{const obj=JSON.parse(reader.result);const arr=Array.isArray(obj)?obj:obj.errors;if(!Array.isArray(arr))throw new Error();state.errors=arr.map(norm);saveState();render();}catch{alert("错题 JSON 格式不正确。")}};reader.readAsText(file);return;
    }
    if(typeof XLSX==="undefined"){alert("Excel 导入库未加载，请联网后刷新。");return;}
    const reader=new FileReader();reader.onload=()=>{try{const wb=XLSX.read(reader.result,{type:"array"});const ws=wb.Sheets[wb.SheetNames.includes("错题库")?"错题库":wb.SheetNames[0]];const rows=XLSX.utils.sheet_to_json(ws,{defval:""});state.errors=rows.map(r=>norm({date:r.日期,subject:r.模块||r.科目,chapter:r.章节||r["章节/题型"],source:r.来源,question:r.题目,myAnswer:r.我的答案,correctAnswer:r.正确答案,type:r.错误类型,reason:r.错误原因,method:r.正确方法||r.知识点,reviewDate:r.复习日期,reviewCount:r.复习次数,status:r.状态,favorite:String(r.收藏)==="是"}));saveState();render();}catch{alert("无法读取这个错题 Excel。")}};reader.readAsArrayBuffer(file);
  }

  window.renderErrors=function(){
    normalizeAll();
    const list=filtered();
    const mastered=state.errors.filter(e=>e.status==="已掌握").length;
    const due=state.errors.filter(e=>e.status!=="已掌握"&&e.reviewDate&&e.reviewDate<=dateISO(new Date())).length;
    const fav=state.errors.filter(e=>e.favorite).length;
    return `<div class="errors-page"><section class="errors-hero"><div><h1>🌷 错题库</h1><p>先把功能跑稳：记录、搜索、复习、收藏、导入导出和云存档都在这里。</p></div><div class="errors-hero-art">🐰🌱🌷</div></section>
    <section class="errors-stats"><div class="errors-stat"><span>全部错题</span><b>${state.errors.length}</b></div><div class="errors-stat"><span>已掌握</span><b>${mastered}</b></div><div class="errors-stat"><span>今日待复习</span><b>${due}</b></div><div class="errors-stat"><span>收藏</span><b>${fav}</b></div></section>
    <div class="errors-actions"><button class="primary" id="newErrorV2">新增错题</button><button class="secondary" id="exportErrorsExcelV2">导出 Excel</button><button class="secondary" id="exportErrorsJsonV2">导出 JSON</button><button class="secondary" id="importErrorsV2">导入错题</button><button class="secondary" id="openCloudV2">GitHub 云存档</button></div>
    <section class="errors-toolbar"><input id="errorKeyword" placeholder="搜索题目、章节、错因或知识点" value="${esc(filters.keyword)}"><select id="errorSubject">${option(["全部","言语理解","判断推理","数量关系","资料分析","常识","申论"],filters.subject)}</select><select id="errorStatus">${option(["全部","待复习","复习中","已掌握"],filters.status)}</select><select id="errorFavorite">${option(["全部","收藏"],filters.favorite)}</select></section>
    <div id="errorEditorHost">${editingIndex!==null?editor(state.errors[editingIndex],editingIndex):""}</div>
    ${list.length?`<section class="errors-grid">${list.map(e=>card(e,state.errors.indexOf(e))).join("")}</section>`:`<div class="errors-empty">还没有符合条件的错题。先记录第一道吧 🌱</div>`}</div>`;
  };

  document.addEventListener("click",e=>{
    if(currentPage!=="errors")return;
    if(e.target.id==="newErrorV2"){editingIndex=-1;document.getElementById("errorEditorHost").innerHTML=editor(norm(),null);}
    if(e.target.id==="cancelErrorEdit"){editingIndex=null;render();}
    if(e.target.id==="saveErrorEdit"){
      const data=norm({id:editingIndex>=0?state.errors[editingIndex].id:undefined,date:eeDate.value,subject:eeSubject.value,chapter:eeChapter.value,source:eeSource.value,question:eeQuestion.value,myAnswer:eeMyAnswer.value,correctAnswer:eeCorrectAnswer.value,type:eeType.value,reason:eeReason.value,method:eeMethod.value,reviewDate:eeReviewDate.value,status:eeStatus.value,favorite:eeFavorite.value==="是",reviewCount:editingIndex>=0?state.errors[editingIndex].reviewCount:0,createdAt:editingIndex>=0?state.errors[editingIndex].createdAt:undefined});
      if(editingIndex>=0)state.errors[editingIndex]=data;else state.errors.unshift(data);editingIndex=null;saveState();render();
    }
    const edit=e.target.closest("[data-error-edit]");if(edit){editingIndex=Number(edit.dataset.errorEdit);render();}
    const del=e.target.closest("[data-error-delete]");if(del&&confirm("确定删除这道错题吗？")){state.errors.splice(Number(del.dataset.errorDelete),1);saveState();render();}
    const star=e.target.closest("[data-error-star]");if(star){const x=state.errors[Number(star.dataset.errorStar)];x.favorite=!x.favorite;saveState();render();}
    const review=e.target.closest("[data-error-review]");if(review){const x=state.errors[Number(review.dataset.errorReview)];x.reviewCount=(x.reviewCount||0)+1;x.lastReviewedAt=new Date().toISOString();if(x.reviewCount>=3&&x.status!=="已掌握")x.status="复习中";saveState();render();}
    if(e.target.id==="exportErrorsJsonV2")exportErrorsJson();
    if(e.target.id==="exportErrorsExcelV2")exportErrorsExcel();
    if(e.target.id==="importErrorsV2"){let input=document.getElementById("errorImportV2");if(!input){input=document.createElement("input");input.id="errorImportV2";input.type="file";input.accept=".json,.xlsx,.xls";input.hidden=true;document.body.appendChild(input);input.addEventListener("change",()=>input.files[0]&&importErrorsFile(input.files[0]));}input.value="";input.click();}
    if(e.target.id==="openCloudV2")document.getElementById("settingsDialog")?.showModal();
  });
  document.addEventListener("input",e=>{if(currentPage!=="errors")return;if(e.target.id==="errorKeyword"){filters.keyword=e.target.value;render();}});
  document.addEventListener("change",e=>{if(currentPage!=="errors")return;if(e.target.id==="errorSubject")filters.subject=e.target.value;if(e.target.id==="errorStatus")filters.status=e.target.value;if(e.target.id==="errorFavorite")filters.favorite=e.target.value;if(["errorSubject","errorStatus","errorFavorite"].includes(e.target.id))render();});
})();