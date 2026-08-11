function revealResult(el){if(el)el.classList.remove('is-empty')}
const GAR='https://www.garlandtools.org';
const FISH_PAGE_SIZE=10;
let fishRows=[],fishPage=1,fishQueryText='';

function rows(d){return Array.isArray(d)?d:Array.isArray(d?.results)?d.results:Array.isArray(d?.items)?d.items:[]}
function rname(x){return x?.obj?.n||x?.name||x?.n||x?.obj?.name||''}
function rid(x){return +(x?.obj?.id||x?.obj?.i||x?.id||x?.i||0)}
function valByKeys(obj,keys,out=[]){
 if(obj==null)return out;
 if(Array.isArray(obj)){obj.forEach(v=>valByKeys(v,keys,out));return out}
 if(typeof obj!=='object')return out;
 for(const [k,v] of Object.entries(obj)){
   if(keys.some(x=>x.test(k))){
     if(['string','number'].includes(typeof v))out.push(String(v));
     else if(v&&typeof v==='object'){
       for(const q of ['name','n','text','value'])if(typeof v[q]==='string')out.push(v[q])
     }
   }
   valByKeys(v,keys,out)
 }
 return [...new Set(out.filter(Boolean))]
}
function clean(a){return [...new Set(a)].map(x=>String(x).trim()).filter(x=>x&&!/^\d+$/.test(x)).slice(0,10)}
async function doc(id){
 for(const shard of [3,2,1]){
   try{const r=await fetch(`${GAR}/db/doc/item/ja/${shard}/${id}.json`);if(r.ok)return r.json()}catch{}
 }
 return null
}
let lodestoneItemIds=null;
async function ensureLodestoneItemIds(){
  if(lodestoneItemIds)return lodestoneItemIds;
  try{
    const r=await fetch('../../assets/data/lodestone-item-id.txt');
    if(!r.ok)throw new Error();
    lodestoneItemIds=(await r.text()).split(/\r?\n/);
  }catch{lodestoneItemIds=[]}
  return lodestoneItemIds;
}
function officialSearch(name){
  return 'https://jp.finalfantasyxiv.com/lodestone/playguide/db/search/?q='+encodeURIComponent(name)
}
function itemDetailUrl(id,name){
  const hash=lodestoneItemIds?.[Number(id)-1]?.trim();
  return hash
    ? `https://jp.finalfantasyxiv.com/lodestone/playguide/db/item/${hash}/`
    : `../../battle/item/index.html?id=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}`;
}
function card(label,a){return `<div class="fish-info"><small>${label}</small><strong>${a.length?a.map(FF14Tools.esc).join(' / '):'データなし'}</strong></div>`}
async function fishDetails(r){
 const name=rname(r),id=rid(r),d=await doc(id);
 if(!d)return {name,id,error:true};
 return {
   name,id,
   spot:clean(valByKeys(d,[/spot/i,/fishing.*place/i,/location/i,/place/i])),
   bait:clean(valByKeys(d,[/bait/i,/tackle/i,/lure/i])),
   weather:clean(valByKeys(d,[/weather/i])),
   time:clean(valByKeys(d,[/start.*hour/i,/end.*hour/i,/time/i])),
   mooch:clean(valByKeys(d,[/mooch/i,/intuition/i,/predator/i,/condition/i]))
 }
}
function fishHtml(x){
 if(x.error){
   return `<article class="fish-direct-item"><div class="fish-direct-head"><h3><a class="external-name-link" href="${itemDetailUrl(x.id,x.name)}" ${itemDetailUrl(x.id,x.name).startsWith("http")?'target="_blank" rel="noopener"':""}>${FF14Tools.esc(x.name)}</a></h3></div><p>釣り条件を自動取得できませんでした。</p></article>`;
 }
 return `<article class="fish-direct-item">
   <div class="fish-direct-head"><h3><a class="external-name-link" href="${itemDetailUrl(x.id,x.name)}" ${itemDetailUrl(x.id,x.name).startsWith("http")?'target="_blank" rel="noopener"':""}>${FF14Tools.esc(x.name)}</a></h3></div>
   <div class="fish-info-grid">${card('釣り場',x.spot)}${card('餌・ルアー',x.bait)}${card('天候',x.weather)}${card('ET・時間',x.time)}${card('泳がせ・直感など',x.mooch)}</div>
 </article>`;
}
function pageButtons(current,total){
 if(total<=1)return '';
 let out=`<button class="lookup-page-btn" data-fish-page="${current-1}" ${current===1?'disabled':''}>‹</button>`;
 const wanted=new Set([1,total,current,current-1,current+1,current-2,current+2]);
 let prev=0;
 for(const n of [...wanted].filter(n=>n>=1&&n<=total).sort((a,b)=>a-b)){
   if(prev&&n-prev>1)out+='<span class="lookup-page-ellipsis">…</span>';
   out+=`<button class="lookup-page-btn ${n===current?'is-active':''}" data-fish-page="${n}">${n}</button>`;
   prev=n;
 }
 out+=`<button class="lookup-page-btn" data-fish-page="${current+1}" ${current===total?'disabled':''}>›</button>`;
 return out
}
async function renderFishPage(page=1){
 await ensureLodestoneItemIds();
 const pages=Math.max(1,Math.ceil(fishRows.length/FISH_PAGE_SIZE));
 fishPage=Math.min(Math.max(1,page),pages);
 const start=(fishPage-1)*FISH_PAGE_SIZE, part=fishRows.slice(start,start+FISH_PAGE_SIZE);
 revealResult(fishResult);fishResult.innerHTML=`<div class="lookup-summary"><strong>「${FF14Tools.esc(fishQueryText)}」：${fishRows.length}件</strong><span>${fishPage} / ${pages} ページ</span></div><div class="lookup-loading">このページの釣り条件を確認しています…</div>`;
 const details=[];
 for(let i=0;i<part.length;i+=4)details.push(...await Promise.all(part.slice(i,i+4).map(fishDetails)));
 revealResult(fishResult);fishResult.innerHTML=`<div class="lookup-summary"><strong>「${FF14Tools.esc(fishQueryText)}」：${fishRows.length}件</strong><span>${fishPage} / ${pages} ページ</span></div><div class="fish-direct-list">${details.map(fishHtml).join('')}</div><div class="lookup-pagination">${pageButtons(fishPage,pages)}</div>`;
 fishResult.querySelectorAll('[data-fish-page]').forEach(b=>{
   if(!b.disabled)b.onclick=()=>{renderFishPage(+b.dataset.fishPage);fishResult.scrollIntoView({behavior:'smooth',block:'start'})}
 });
}
fishSearch.onclick=async()=>{
 const q=fishQuery.value.trim();
 if(!q){revealResult(fishResult);fishResult.textContent='魚名を入力してください。';return}
 fishSearch.disabled=true;fishSearch.textContent='検索中…';revealResult(fishResult);fishResult.textContent='一致する魚を検索しています…';
 try{
   const r=await fetch(`${GAR}/api/search.php?text=${encodeURIComponent(q)}&lang=ja`);
   if(!r.ok)throw new Error('検索データへ接続できませんでした');
   const nq=q.normalize('NFKC').toLocaleLowerCase('ja'),seen=new Set();
   fishRows=rows(await r.json()).filter(x=>rname(x).normalize('NFKC').toLocaleLowerCase('ja').includes(nq)).filter(x=>{const id=rid(x);if(!id||seen.has(id))return false;seen.add(id);return true}).sort((a,b)=>{
     const an=rname(a).normalize('NFKC').toLocaleLowerCase('ja'),bn=rname(b).normalize('NFKC').toLocaleLowerCase('ja');
     const ar=an===nq?0:an.startsWith(nq)?1:2,br=bn===nq?0:bn.startsWith(nq)?1:2;
     return ar-br||an.length-bn.length||an.localeCompare(bn,'ja')
   });
   if(!fishRows.length)throw new Error('一致する魚が見つかりませんでした');
   fishQueryText=q;fishPage=1;await renderFishPage(1)
 }catch(e){
   fishRows=[];revealResult(fishResult);fishResult.innerHTML=`<h3>見つかりませんでした</h3><p>${FF14Tools.esc(e.message||'魚名を短くして検索してください。')}</p><div class="tool-actions"><a class="tool-btn secondary" target="_blank" rel="noopener" href="${officialSearch(q)}">日本語の公式DBで検索</a></div>`
 }finally{fishSearch.disabled=false;fishSearch.textContent='検索する'}
};
fishQuery.addEventListener('keydown',e=>{if(e.key==='Enter')fishSearch.click()});