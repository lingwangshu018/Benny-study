// Benny Study · 错题照片附件
(function(){
  const DB_NAME='benny-study-media';
  const STORE='error-images';
  const MAX_IMAGES=5;
  let draft=[];
  let editingId='';

  function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:'id'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
  async function putImage(row){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(row);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}
  async function getImage(id){const db=await openDB();return new Promise((resolve,reject)=>{const req=db.transaction(STORE).objectStore(STORE).get(id);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
  async function deleteImage(id){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}
  function compress(file){return new Promise((resolve,reject)=>{const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{const max=1800,scale=Math.min(1,max/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);canvas.toBlob(blob=>{URL.revokeObjectURL(url);blob?resolve(blob):reject(new Error('图片压缩失败'));},'image/jpeg',.82);};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('图片读取失败'));};img.src=url;});}
  function findEditingRecord(){const q=document.getElementById('eeQuestion')?.value||'',d=document.getElementById('eeDate')?.value||'',s=document.getElementById('eeSource')?.value||'';return (state.errors||[]).find(x=>x.question===q&&x.date===d&&(x.source||'')===s);}
  async function renderPreview(){const host=document.getElementById('errorPhotoPreview');if(!host)return;const ids=[...draft];host.innerHTML=ids.length?'<div class="error-photo-grid">'+ids.map(id=>`<div class="error-photo-item" data-photo-id="${id}"><div class="error-photo-thumb">加载中…</div><button type="button" data-remove-photo="${id}">×</button></div>`).join('')+'</div>':'<p class="error-photo-empty">还没有图片，可上传题目截图、草稿或解析。</p>';for(const id of ids){const row=await getImage(id);const el=host.querySelector(`[data-photo-id="${id}"] .error-photo-thumb`);if(row&&el){const url=URL.createObjectURL(row.blob);el.innerHTML=`<img src="${url}" alt="错题照片">`;el.querySelector('img').onclick=()=>window.open(url,'_blank');}}}
  function enhanceEditor(){const grid=document.querySelector('.error-editor-grid');if(!grid||grid.querySelector('.error-photo-field'))return;const rec=findEditingRecord();editingId=rec?.id||'';draft=[...(rec?.imageIds||[])];grid.insertAdjacentHTML('beforeend',`<div class="error-photo-field wide"><div class="error-photo-title"><div><b>📷 错题照片</b><small>最多 ${MAX_IMAGES} 张，自动压缩并保存在当前设备。</small></div><label class="secondary error-photo-upload">选择照片<input id="errorPhotoInput" type="file" accept="image/*" capture="environment" multiple hidden></label></div><div id="errorPhotoPreview"></div></div>`);renderPreview();}
  const observer=new MutationObserver(()=>enhanceEditor());observer.observe(document.body,{childList:true,subtree:true});

  document.addEventListener('change',async e=>{if(e.target.id!=='errorPhotoInput')return;const files=[...e.target.files].slice(0,Math.max(0,MAX_IMAGES-draft.length));for(const file of files){try{const blob=await compress(file);const id=`img-${Date.now()}-${Math.random().toString(16).slice(2)}`;await putImage({id,blob,name:file.name||`${id}.jpg`,createdAt:new Date().toISOString()});draft.push(id);}catch(err){alert(err.message);}}e.target.value='';renderPreview();});
  document.addEventListener('click',async e=>{const remove=e.target.closest('[data-remove-photo]');if(remove){const id=remove.dataset.removePhoto;draft=draft.filter(x=>x!==id);await deleteImage(id);renderPreview();return;}
    if(e.target.id==='saveErrorEdit'&&currentPage==='errors'){
      const ids=[...draft],oldId=editingId;
      setTimeout(()=>{let rec=oldId?(state.errors||[]).find(x=>x.id===oldId):(state.errors||[])[0];if(rec){rec.imageIds=ids;saveState();render();}draft=[];editingId='';},80);
    }
    const pack=e.target.closest('#exportErrorPhotoPack');if(pack){exportPhotoPack();}
  },true);

  async function exportPhotoPack(){if(typeof JSZip==='undefined'){alert('图片打包组件未加载，请联网刷新后再试。');return;}const zip=new JSZip();const data={version:1,exportedAt:new Date().toISOString(),errors:(state.errors||[]).map(x=>({...x}))};zip.file('错题数据.json',JSON.stringify(data,null,2));let count=0;for(const err of state.errors||[]){for(const id of err.imageIds||[]){const row=await getImage(id);if(row?.blob){zip.file(`images/${err.id}/${row.name||id+'.jpg'}`,row.blob);count++;}}}zip.file('README.txt',`Benny Study 错题图包\n错题数量：${state.errors.length}\n图片数量：${count}\n将“错题数据.json”和 images 文件夹一起上传给 AI，即可结合图片分析。`);const blob=await zip.generateAsync({type:'blob'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`Benny-study-错题图包-${dateISO(new Date())}.zip`;a.click();URL.revokeObjectURL(a.href);}

  function addExportButton(){if(currentPage!=='errors')return;const actions=document.querySelector('.errors-actions');if(actions&&!document.getElementById('exportErrorPhotoPack'))actions.insertAdjacentHTML('beforeend','<button class="secondary" id="exportErrorPhotoPack" type="button">导出错题图包</button>');
    document.querySelectorAll('.error-card').forEach((card,i)=>{const list=(state.errors||[]).filter(e=>{const k='';return true;});const rec=list[i];if(rec?.imageIds?.length&&!card.querySelector('.error-photo-badge'))card.querySelector('.error-card-head')?.insertAdjacentHTML('beforeend',`<span class="error-photo-badge">📷 ${rec.imageIds.length}</span>`);});}
  const oldRender=window.render; if(typeof oldRender==='function')window.render=function(){oldRender();setTimeout(addExportButton,0);};
  setTimeout(addExportButton,0);
})();