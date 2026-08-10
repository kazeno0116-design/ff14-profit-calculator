const GARLAND='https://www.garlandtools.org';const XIV='https://v2.xivapi.com/api';
const list=document.getElementById('expansionList'),detail=document.getElementById('dungeonDetail');
function esc(s){return FF14Tools.esc(s)}
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
function itemDetailUrl(id,name){
  const hash=lodestoneItemIds?.[Number(id)-1]?.trim();
  return hash
    ? `https://jp.finalfantasyxiv.com/lodestone/playguide/db/item/${hash}/`
    : `../item/index.html?id=${encodeURIComponent(id)}&name=${encodeURIComponent(name)}`;
}

function renderExpansions(){
 list.innerHTML=Object.entries(DUNGEON_DATA).map(([key,x])=>`<div class="expansion-panel" data-key="${key}">
   <button class="expansion-toggle"><span><strong>${esc(x.label)}</strong><span>${x.items.length} ID</span></span></button>
   <div class="dungeon-list">${x.items.map((d,i)=>`<div class="dungeon-row dungeon-row-name-only">
     <button class="dungeon-name-btn" data-exp="${key}" data-i="${i}"><strong>${esc(d[1])}</strong></button>
   </div>`).join('')}</div></div>`).join('');
 list.querySelectorAll('.expansion-toggle').forEach(b=>b.onclick=()=>b.parentElement.classList.toggle('is-open'));
 list.querySelectorAll('.dungeon-name-btn').forEach(b=>b.onclick=()=>openDungeon(b.dataset.exp,+b.dataset.i));
}
function getRows(d){return Array.isArray(d)?d:Array.isArray(d?.results)?d.results:Array.isArray(d?.items)?d.items:[]}
function rowName(r){return r?.obj?.n||r?.name||r?.n||r?.obj?.name||''}function rowId(r){return +(r?.obj?.id||r?.obj?.i||r?.id||r?.i||0)}
function walkItemRefs(node,path='',out=[]){if(node==null)return out;if(Array.isArray(node)){node.forEach((v,i)=>walkItemRefs(v,path+'['+i+']',out));return out}if(typeof node!=='object')return out;for(const [k,v] of Object.entries(node)){const p=path?path+'.'+k:k;if(/drop|loot|reward|treasure|chest|item/i.test(k)){if(typeof v==='number'&&v>100)out.push(v);if(Array.isArray(v))v.forEach(x=>{if(typeof x==='number'&&x>100)out.push(x);else if(x&&typeof x==='object'){const id=+(x.id||x.i||x.itemId||x.item_id||0);if(id>100)out.push(id)}})}walkItemRefs(v,p,out)}return out}
async function itemName(id){try{const r=await fetch(`${GARLAND}/db/doc/item/ja/3/${id}.json`);if(!r.ok)return '';const d=await r.json();return d?.item?.name||d?.item?.n||d?.name||''}catch{return ''}}
async function garlandInstance(name){const s=await fetch(`${GARLAND}/api/search.php?text=${encodeURIComponent(name)}&lang=ja`);if(!s.ok)return null;const rows=getRows(await s.json());let r=rows.find(x=>rowName(x)===name&&/instance/i.test(String(x.type||x?.obj?.type||'')))||rows.find(x=>rowName(x)===name)||rows[0];if(!r||!rowId(r))return null;const f=await fetch(`${GARLAND}/db/doc/instance/ja/2/${rowId(r)}.json`);if(!f.ok)return null;return {id:rowId(r),data:await f.json()}}
async function xivInfo(name){try{const q=encodeURIComponent(`Name@ja="${name.replaceAll('"','')}"`);const u=`${XIV}/search?sheets=ContentFinderCondition&language=ja&limit=2&fields=Name,ClassJobLevelRequired,ItemLevelRequired,ContentType.Name&query=${q}`;const r=await fetch(u);if(!r.ok)return null;const d=await r.json();return d.results?.[0]?.fields||null}catch{return null}}
function closeDungeonDetail(trigger){
  detail.innerHTML='';
  if(trigger){
    trigger.scrollIntoView({behavior:'smooth',block:'center'});
    setTimeout(()=>trigger.focus({preventScroll:true}),250);
  }
}
async function openDungeon(exp,i){
  const d=DUNGEON_DATA[exp].items[i];
  const trigger=list.querySelector(`.dungeon-name-btn[data-exp="${exp}"][data-i="${i}"]`);
  detail.innerHTML=`<h2>${esc(d[1])}</h2><p>情報を取得しています…</p>`;
  detail.scrollIntoView({behavior:'smooth',block:'start'});
  const [xiv,g]=await Promise.all([xivInfo(d[1]),garlandInstance(d[1])]);
  const level=xiv?.ClassJobLevelRequired||d[2],il=xiv?.ItemLevelRequired||0;
  const ids=g?[...new Set(walkItemRefs(g.data))].slice(0,30):[];
  const drops=[];
  for(const itemId of ids){
    const n=await itemName(itemId);
    if(n)drops.push({id:itemId,name:n});
  }
  const uniq=[...new Map(drops.map(x=>[x.id,x])).values()].slice(0,24);
  await ensureLodestoneItemIds();
  const dropHtml=uniq.length
    ? `<div class="drop-grid">${uniq.map(x=>{const u=itemDetailUrl(x.id,x.name);return `<a class="drop-item drop-item-link" href="${u}" ${u.startsWith('http')?'target="_blank" rel="noopener"':''}>${esc(x.name)}</a>`}).join('')}</div>`
    : '<p>ドロップ情報を取得できませんでした。時間を置いて、もう一度確認してください。</p>';
  detail.innerHTML=`<div class="detail-head-row">
    <div><div class="article-kicker">${esc(DUNGEON_DATA[exp].label)} / Lv ${level}</div><h2>${esc(d[1])}</h2></div>
    <button class="detail-close-btn" type="button">閉じる</button>
  </div>
  <div class="feature-grid">
    <div class="feature-box"><small>LEVEL</small><h3>参加目安</h3><p>Lv ${level}${il?' / 平均IL '+il+'～':''}</p></div>
    <div class="feature-box"><small>DROP</small><h3>主な報酬</h3><p>宝箱やボス報酬を下に表示します。</p></div>
  </div>
  <h3 style="margin-top:18px">主なドロップ・報酬</h3>${dropHtml}`;
  detail.querySelector('.detail-close-btn')?.addEventListener('click',()=>closeDungeonDetail(trigger));
}
renderExpansions();