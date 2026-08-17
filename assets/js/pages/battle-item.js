const API='https://v2.xivapi.com/api';
const params=new URLSearchParams(location.search);
const id=Number(params.get('id')||0);
const fallbackName=params.get('name')||'';
const box=document.getElementById('itemDetail');
const title=document.getElementById('itemDetailTitle');
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
function officialItemUrl(itemId,name){
  const hash=lodestoneItemIds?.[Number(itemId)-1]?.trim();
  return hash
    ? `https://jp.finalfantasyxiv.com/lodestone/playguide/db/item/${hash}/`
    : `https://jp.finalfantasyxiv.com/lodestone/playguide/db/search/?q=${encodeURIComponent(name)}`;
}

function esc(v){return FF14Tools.esc(String(v??''))}
function relationName(v){
  if(v==null)return '';
  if(typeof v==='string')return v;
  if(typeof v==='number')return '';
  return v?.fields?.Name||v?.value?.fields?.Name||v?.Name||v?.name||'';
}
function num(v){
  if(typeof v==='number')return v;
  if(typeof v?.value==='number')return v.value;
  if(typeof v?.row_id==='number')return v.row_id;
  return 0;
}
function cleanDescription(v){
  return String(v||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
}
function statsFromFields(f){
  const names=Array.isArray(f.BaseParam)?f.BaseParam:[];
  const vals=Array.isArray(f.BaseParamValue)?f.BaseParamValue:[];
  const sn=Array.isArray(f.BaseParamSpecial)?f.BaseParamSpecial:[];
  const sv=Array.isArray(f.BaseParamValueSpecial)?f.BaseParamValueSpecial:[];
  const out=[];
  names.forEach((x,i)=>{const n=relationName(x),v=Number(vals[i]||0);if(n&&v)out.push([n,v])});
  sn.forEach((x,i)=>{const n=relationName(x),v=Number(sv[i]||0);if(n&&v)out.push([n,v])});
  return out;
}
function fact(label,value){
  if(value===undefined||value===null||value==='')return '';
  return `<div class="item-fact"><small>${esc(label)}</small><strong>${esc(value)}</strong></div>`;
}
function renderXiv(data){
  const f=data?.fields||{};
  const name=f.Name||fallbackName||`アイテム ${id}`;
  title.textContent=name;
  document.title=`${name} | アイテム詳細`;
  const itemLevel=num(f.LevelItem);
  const equipLevel=num(f.LevelEquip);
  const category=relationName(f.ItemUICategory)||relationName(f.ItemSearchCategory);
  const jobs=relationName(f.ClassJobCategory);
  const repair=relationName(f.ItemRepair)||relationName(f.ClassJobRepair);
  const desc=cleanDescription(f.Description);
  const stats=statsFromFields(f);
  const statsHtml=stats.length?`<div class="item-stat-grid">${stats.map(([n,v])=>`<div><span>${esc(n)}</span><strong>+${esc(v)}</strong></div>`).join('')}</div>`:'<p class="muted-copy">表示できるボーナス情報はありません。</p>';
  const legacyNotice=name.startsWith('†')
    ? '<div class="acquisition-source"><div class="acquisition-source-head"><span class="acquisition-category">旧FF14引継ぎ</span><strong>レガシーアイテム</strong></div><div class="acquisition-method">旧FF14から引き継がれたアイテムです。現行FF14では通常の新規入手対象ではありません。</div></div>'
    : category==='排出停止アイテム'
      ? '<div class="acquisition-source"><div class="acquisition-source-head"><span class="acquisition-category">排出停止</span><strong>排出停止アイテム</strong></div><div class="acquisition-method">公式データベースで排出停止に分類されています。現在の通常入手先としては案内しません。</div></div>'
      : id===47
        ? '<div class="acquisition-source"><div class="acquisition-source-head"><span class="acquisition-category">旧トークン</span><strong>アラガントームストーン：天道</strong></div><div class="acquisition-method">現在は新規獲得・アイテム交換が終了しており、所持分は数理への交換対象です。</div></div>'
        : '';
  box.innerHTML=`<div class="item-detail-head"><div><span class="article-kicker">ITEM</span><h2>${esc(name)}</h2>${desc?`<p>${esc(desc)}</p>`:''}</div>
    <a class="official-inline-link" href="${officialItemUrl(id,name)}" target="_blank" rel="noopener">公式DBでも確認 →</a></div>
    ${legacyNotice}
    <div class="item-fact-grid">
      ${fact('ITEM Lv',itemLevel||'—')}
      ${fact('装備Lv',equipLevel||'—')}
      ${fact('カテゴリ',category||'—')}
      ${fact('装備可能',jobs||'—')}
      ${fact('修理',repair||'—')}
    </div>
    <h3>ボーナス</h3>${statsHtml}`;
}
(async()=>{
  await ensureLodestoneItemIds();
  if(!id){box.innerHTML='<h2>アイテムを特定できませんでした</h2><p>検索結果からアイテム名を選び直してください。</p>';return}
  try{
    const r=await fetch(`${API}/sheet/Item/${id}?language=ja`);
    if(!r.ok)throw new Error();
    renderXiv(await r.json());
  }catch{box.innerHTML='<h2>情報を取得できませんでした</h2><p>日本語公式DBから確認してください。</p>'}
})();