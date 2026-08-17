(()=>{
  'use strict';
  document.querySelectorAll('.utility-copy-command').forEach(btn=>{
    btn.addEventListener('click',async()=>{
      const text=btn.dataset.copy||'';
      if(!text)return;
      const original=btn.textContent;
      try{
        if(navigator.clipboard?.writeText){
          await navigator.clipboard.writeText(text);
        }else{
          const ta=document.createElement('textarea');
          ta.value=text;
          ta.style.position='fixed';
          ta.style.opacity='0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
        }
        btn.textContent='コピーしました';
        setTimeout(()=>btn.textContent=original,1200);
      }catch(_){
        btn.textContent='コピー失敗';
        setTimeout(()=>btn.textContent=original,1200);
      }
    });
  });
})();