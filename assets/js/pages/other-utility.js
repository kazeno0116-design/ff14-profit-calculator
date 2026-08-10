(()=>{
 const lineIn=document.getElementById('macroLineInput'), lineOut=document.getElementById('macroLineResult');
 const updateLines=()=>{
   const raw=lineIn.value.replace(/\r/g,'');
   const lines=raw?raw.split('\n').filter((x,i,a)=>!(i===a.length-1&&x==='')).length:0;
   const blocks=lines?Math.ceil(lines/15):0;
   lineOut.innerHTML=lines+'行'+(lines?` <span>／ 15行単位なら ${blocks}ブロック</span>`:'');
 };
 lineIn.addEventListener('input',updateLines);
 document.getElementById('macroLineClear').onclick=()=>{lineIn.value='';updateLines();lineIn.focus()};
 const chatIn=document.getElementById('chatCountInput'), chatOut=document.getElementById('chatCountResult');
 const updateChat=()=>chatOut.textContent=chatIn.value.length+'文字';
 chatIn.addEventListener('input',updateChat);
 document.getElementById('chatCountCopy').onclick=async function(){
   try{await navigator.clipboard.writeText(chatIn.value);this.textContent='コピーしました';setTimeout(()=>this.textContent='コピー',1200)}
   catch(_){chatIn.select();document.execCommand('copy')}
 };
})();