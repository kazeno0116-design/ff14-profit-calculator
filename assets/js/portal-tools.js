
window.FF14Tools={
  copy: async function(text,btn){
    try{await navigator.clipboard.writeText(text)}
    catch(e){const t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove()}
    if(btn){const old=btn.textContent;btn.textContent='COPIED';setTimeout(()=>btn.textContent=old,1200)}
  },
  save:function(key,value){localStorage.setItem(key,JSON.stringify(value))},
  load:function(key,fallback){try{const v=JSON.parse(localStorage.getItem(key));return v??fallback}catch(e){return fallback}},
  esc:function(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
};
