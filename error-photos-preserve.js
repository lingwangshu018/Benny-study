// Preserve error image references across legacy normalization.
(function(){
  const previousRender=window.render;
  if(typeof previousRender!=='function')return;
  window.render=function(){
    const refs=new Map((state.errors||[]).map(e=>[e.id,[...(e.imageIds||[])]]));
    previousRender();
    let changed=false;
    for(const e of state.errors||[]){
      const ids=refs.get(e.id);
      if(ids&&ids.length){e.imageIds=ids;changed=true;}
    }
    if(changed)saveState();
  };
})();