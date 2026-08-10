function revealResult(el){if(el)el.classList.remove('is-empty')}
const DEFAULT_ROWS=3; let currentResult=null;
function esc(s){return FF14Tools.esc(s)}
function fmt(n,d=0){return Number(n).toLocaleString('ja-JP',{maximumFractionDigits:d})}
function num(id){return Math.max(0,Number(document.getElementById(id).value)||0)}
function rowTemplate(v={}){
 return `<div class="profit-material-row"><input class="pm-name" type="text" placeholder="素材名" value="${esc(v.name||'')}"><input class="pm-qty" type="number" min="0" step="1" value="${v.qty??1}"><input class="pm-price" type="number" min="0" step="1" value="${v.price??0}"><input class="pm-time" type="number" min="0" step="0.1" value="${v.time??0}"><button class="icon-remove" type="button" aria-label="削除">×</button></div>`;
}
function bindRows(){
 document.querySelectorAll('.profit-material-row .icon-remove').forEach(b=>b.onclick=()=>{b.closest('.profit-material-row').remove();saveProfitInputs()});
 document.querySelectorAll('#materialRows input').forEach(i=>i.addEventListener('change',saveProfitInputs));
}
function addRow(v={}){materialRows.insertAdjacentHTML('beforeend',rowTemplate(v));bindRows()}
function getMaterials(){
 return [...document.querySelectorAll('.profit-material-row')].map(r=>({name:r.querySelector('.pm-name').value.trim()||'素材',qty:Math.max(0,+r.querySelector('.pm-qty').value||0),price:Math.max(0,+r.querySelector('.pm-price').value||0),time:Math.max(0,+r.querySelector('.pm-time').value||0)})).filter(x=>x.qty>0);
}
function saveProfitInputs(){
 FF14Tools.save('profitCalculatorInputs',{sell:num('sellPrice'),yield:num('craftYield')||1,tax:num('marketTax'),craftTime:num('craftMinutes'),target:num('targetProfit'),materials:getMaterials()});
}
function restoreProfitInputs(){
 const s=FF14Tools.load('profitCalculatorInputs',null); if(!s){for(let i=0;i<DEFAULT_ROWS;i++)addRow();return}
 sellPrice.value=s.sell??0;craftYield.value=s.yield??1;marketTax.value=s.tax??5;craftMinutes.value=s.craftTime??1;targetProfit.value=s.target??100000;(s.materials?.length?s.materials:Array(DEFAULT_ROWS).fill({})).forEach(addRow);
}
function modeCalc(mode,materials,sell,yld,tax,craftTime,target){
 const netRevenue=sell*yld*(1-tax/100);
 const materialCost=mode==='buy'?materials.reduce((a,x)=>a+x.qty*x.price,0):0;
 const gatherMin=mode==='self'?materials.reduce((a,x)=>a+x.qty*x.time,0):0;
 const profit=netRevenue-materialCost;
 const totalMin=craftTime+gatherMin;
 const crafts=profit>0?Math.ceil(target/profit):null;
 const itemCount=crafts==null?null:crafts*yld;
 const targetRevenue=crafts==null?null:crafts*netRevenue;
 const targetCost=crafts==null?null:crafts*materialCost;
 const totalTime=crafts==null?null:crafts*totalMin;
 const hourly=totalMin>0?profit/(totalMin/60):null;
 const roi=materialCost>0?profit/materialCost:null;
 return {mode,netRevenue,materialCost,gatherMin,profit,totalMin,crafts,itemCount,targetRevenue,targetCost,totalTime,hourly,roi};
}
function materialsHtml(materials,crafts,mode){
 if(crafts==null)return '';
 return materials.map(x=>`<div class="result-item"><strong>${esc(x.name)} × ${fmt(x.qty*crafts)}</strong><span>${mode==='buy'?'購入額 '+fmt(x.qty*crafts*x.price)+'ギル':'自力調達目安 '+fmt(x.qty*crafts*x.time,1)+'分'}</span></div>`).join('');
}
function modeCard(x,label,materials){
 if(x.profit<=0)return `<div class="profit-mode-card"><div class="profit-mode-title">${label}</div><strong class="profit-negative">1回の製作で利益が出ません</strong><p>売価または素材価格を見直してください。</p></div>`;
 return `<div class="profit-mode-card"><div class="profit-mode-title">${label}</div><div class="profit-kpis"><div><small>1回の純利益</small><strong>${fmt(x.profit)} ギル</strong></div><div><small>目標まで</small><strong>${fmt(x.crafts)} 回</strong></div><div><small>時間効率</small><strong>${x.hourly==null?'—':fmt(x.hourly)+' ギル/時'}</strong></div><div><small>${x.mode==='buy'?'必要資金':'調達時間'}</small><strong>${x.mode==='buy'?fmt(x.targetCost)+' ギル':fmt(x.totalTime,1)+' 分'}</strong></div></div><div class="profit-detail"><span>完成品：${fmt(x.itemCount)}個</span><span>所要時間：約${fmt(x.totalTime,1)}分</span>${x.roi==null?'':`<span>費用効率：投資1ギルあたり ${x.roi.toFixed(2)}ギル利益</span>`}</div><details><summary>目標までに必要な素材</summary><div class="result-list">${materialsHtml(materials,x.crafts,x.mode)}</div></details></div>`;
}
function calc(){
 const sell=num('sellPrice'),yld=Math.max(1,num('craftYield')),tax=Math.min(100,num('marketTax')),craftTime=num('craftMinutes'),target=num('targetProfit'),materials=getMaterials();
 if(!sell||!materials.length){revealResult(profitResult);profitResult.innerHTML='<h3>入力が不足しています</h3><p>完成品の売価と、1つ以上の必要素材を入力してください。</p>';return}
 const buy=modeCalc('buy',materials,sell,yld,tax,craftTime,target),self=modeCalc('self',materials,sell,yld,tax,craftTime,target);
 const viable=[buy,self].filter(x=>x.profit>0);
 let recommendation='利益が出る条件がありません。';
 if(viable.length){
   const timeBest=viable.filter(x=>x.hourly!=null).sort((a,b)=>b.hourly-a.hourly)[0];
   if(timeBest?.mode==='buy') recommendation='時間効率は「素材を購入」が高いです。素材集めの時間を使わず、製作回数を回しやすいためです。';
   else recommendation='時間効率は「自力調達」が高いです。購入費を使わず確保できる利益が、入力した調達時間を含めても有利です。';
   if(buy.profit>0&&self.profit>0) recommendation+=` 費用を抑えるなら自力調達、短時間で回したいなら ${buy.hourly>=self.hourly?'購入':'自力調達'} が向いています。`;
 }
 currentResult={timestamp:Date.now(),sell,yld,tax,craftTime,target,materials,buy,self,recommendation};
 revealResult(profitResult);profitResult.innerHTML=`<div class="profit-recommend"><strong>比較結果</strong><p>${esc(recommendation)}</p></div><div class="profit-mode-grid">${modeCard(buy,'素材を購入',materials)}${modeCard(self,'素材を自力調達',materials)}</div><div class="tool-actions"><button class="tool-btn" id="addComparison">この結果を比較に追加</button></div>`;
 document.getElementById('addComparison').onclick=()=>addComparison(currentResult);
 saveProfitInputs();
}
function comparisonLabel(i){return '比較 '+(i+1)}
function getScore(r){
 const hs=[r.buy.hourly||0,r.self.hourly||0],bestHourly=Math.max(...hs);
 const bestProfit=Math.max(r.buy.profit||0,r.self.profit||0);
 return {hourly:bestHourly,profit:bestProfit};
}
function addComparison(r){
 const arr=FF14Tools.load('profitComparisons',[]);arr.push(r);FF14Tools.save('profitComparisons',arr);renderComparisons();
}
function renderComparisons(){
 const arr=FF14Tools.load('profitComparisons',[]);
 if(!arr.length){profitComparisons.innerHTML='<p class="muted-copy">まだ比較結果はありません。</p>';return}
 const scores=arr.map(getScore),maxH=Math.max(...scores.map(x=>x.hourly)),maxP=Math.max(...scores.map(x=>x.profit));
 profitComparisons.innerHTML=arr.map((r,i)=>{
   const s=scores[i],best=s.hourly===maxH&&s.profit===maxP;
   return `<div class="saved-profit ${best?'is-best':''}"><div><small>${best?'総合候補':'保存結果'}</small><h3>${comparisonLabel(i)}</h3><p>売価 ${fmt(r.sell)} / 目標 ${fmt(r.target)}ギル</p></div><div class="saved-profit-metrics"><span>最高純利益 <strong>${fmt(s.profit)}G/回</strong></span><span>最高時間効率 <strong>${fmt(s.hourly)}G/時</strong></span></div><button class="icon-remove" data-remove="${i}" type="button">×</button></div>`;
 }).join('')+`<div class="profit-best-reason"><strong>最も有利な候補</strong><p>時間効率と1回あたりの利益の両方が最大の結果を「総合候補」として表示しています。片方だけを重視する場合は各数値を比較してください。</p></div>`;
 profitComparisons.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{const a=FF14Tools.load('profitComparisons',[]);a.splice(+b.dataset.remove,1);FF14Tools.save('profitComparisons',a);renderComparisons()});
}
addMaterial.onclick=()=>addRow();
calcProfit.onclick=calc;
clearComparisons.onclick=()=>{FF14Tools.save('profitComparisons',[]);renderComparisons()};
['sellPrice','craftYield','marketTax','craftMinutes','targetProfit'].forEach(id=>document.getElementById(id).addEventListener('change',saveProfitInputs));
restoreProfitInputs();renderComparisons();