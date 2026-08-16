function revealResult(el){if(el)el.classList.remove('is-empty')}
const API='https://v2.xivapi.com/api';
const PAGE_SIZE=20;
let candidates=[],candidatePage=1,currentQuery='';
const nameCache=new Map(),recipeCache=new Map(),recipeChoice=new Map();
let activeCandidate=null,activeRootCraft=0;

function escq(s){return String(s).replaceAll('\\','\\\\').replaceAll('"','\\"')}
function norm(s){return String(s||'').normalize('NFKC').toLocaleLowerCase('ja')}
function relId(v){if(v==null)return 0;if(typeof v==='number')return v;return +(v.row_id||v.value?.row_id||v.value||v.id||v.ID||0)}
function relName(v){return v?.fields?.Name||v?.value?.fields?.Name||v?.Name||v?.name||''}
const CRAFT_NAMES=['木工','鍛冶','甲冑','彫金','革細工','裁縫','錬金','調理'];
const CRAFT_LABELS=['木工師','鍛冶師','甲冑師','彫金師','革細工師','裁縫師','錬金術師','調理師'];
function craftName(v){return relName(v)||CRAFT_LABELS[relId(v)]||CRAFT_NAMES[relId(v)]||'製作'}
function craftMatches(v,idx){const id=relId(v),n=norm(relName(v));return id===idx||n.includes(norm(CRAFT_NAMES[idx]))}
function isCrystalName(name){return /(シャード|クリスタル|クラスター)$/.test(name)}
async function fetchJson(url){const r=await fetch(url);if(!r.ok)throw new Error('データを取得できませんでした');return r.json()}

async function searchItems(q){
  const nq=norm(q); let rows=[],cursor='',loops=0;
  do{
    let url;
    if(cursor){
      url=`${API}/search?cursor=${encodeURIComponent(cursor)}&limit=100&fields=Name`;
    }else{
      const query='Name@ja~"'+escq(q)+'"';
      url=`${API}/search?sheets=Item&language=ja&limit=100&fields=Name&query=${encodeURIComponent(query)}`;
    }
    const d=await fetchJson(url);
    rows.push(...(d.results||[]));
    cursor=d.next||d.next_cursor||'';
    loops++;
  }while(cursor&&loops<10);

  const seen=new Set();
  return rows.filter(x=>{
    if(!x.row_id||seen.has(x.row_id))return false;
    seen.add(x.row_id);
    return norm(x.fields?.Name).includes(nq);
  }).sort((a,b)=>{
    const an=norm(a.fields?.Name),bn=norm(b.fields?.Name);
    const ar=an===nq?0:an.startsWith(nq)?1:2;
    const br=bn===nq?0:bn.startsWith(nq)?1:2;
    return ar-br || an.length-bn.length || an.localeCompare(bn,'ja');
  });
}

async function itemName(id){
  if(nameCache.has(id))return nameCache.get(id);
  const d=await fetchJson(`${API}/sheet/Item/${id}?language=ja&fields=Name`);
  const n=d.fields?.Name||`アイテム ${id}`;nameCache.set(id,n);return n;
}
async function recipesByItem(id){
  if(recipeCache.has(id))return recipeCache.get(id);
  const q=encodeURIComponent('ItemResult='+id);
  const d=await fetchJson(`${API}/search?sheets=Recipe&language=ja&limit=100&fields=AmountIngredient,AmountResult,Ingredient,ItemResult.Name,CraftType.Name&query=${q}`);
  const seen=new Set(),rows=[];
  for(const r of (d.results||[])){
    const f=r.fields||{},ings=(f.Ingredient||[]).map(relId),amts=(f.AmountIngredient||[]).map(x=>+x||0);
    const sig=JSON.stringify([relId(f.CraftType),+f.AmountResult||1,ings,amts]);
    if(seen.has(sig))continue;seen.add(sig);rows.push(r);
  }
  recipeCache.set(id,rows);return rows;
}
class RecipeChoiceNeeded extends Error{constructor(itemId,label,options){super('recipe choice needed');this.itemId=itemId;this.label=label;this.options=options}}
class RootRecipeUnavailable extends Error{constructor(label,craft){super('root recipe unavailable');this.label=label;this.craft=craft}}

async function recipeMaterialSignature(rec){
  const f=rec.fields||{},ings=f.Ingredient||[],amts=f.AmountIngredient||[],parts=[];
  for(let i=0;i<ings.length;i++){
    const id=relId(ings[i]),amount=+(amts[i]||0);if(!id||!amount)continue;
    const n=await itemName(id);
    if(isCrystalName(n))continue;
    parts.push(`${id}:${amount}`);
  }
  parts.sort();
  return JSON.stringify([Math.max(1,+f.AmountResult||1),parts]);
}
async function chooseIntermediateRecipe(id,label,rows){
  if(rows.length===1)return rows[0];
  const chosen=recipeChoice.get(id);
  if(chosen!=null&&rows[chosen])return rows[chosen];

  const signatures=[];
  for(const r of rows)signatures.push(await recipeMaterialSignature(r));
  if(new Set(signatures).size===1){
    const sameCraft=rows.find(r=>craftMatches(r.fields?.CraftType,activeRootCraft));
    return sameCraft||rows[0];
  }
  throw new RecipeChoiceNeeded(id,label||await itemName(id),rows);
}
async function recipeByItem(id,label='',isRoot=false){
  const rows=await recipesByItem(id);
  if(!rows.length)return null;

  if(isRoot){
    const matching=rows.filter(r=>craftMatches(r.fields?.CraftType,activeRootCraft));
    if(!matching.length)throw new RootRecipeUnavailable(label||await itemName(id),CRAFT_LABELS[activeRootCraft]);
    if(matching.length===1)return matching[0];
    return chooseIntermediateRecipe(id,label,matching);
  }
  return chooseIntermediateRecipe(id,label,rows);
}
async function hasRecipe(id){return (await recipesByItem(id)).length>0}
function isCrystal(name){return isCrystalName(name)}
async function expandStructured(itemId,label,qty,depth,maxDepth,base,steps,crystalTotals){
 const rec=await recipeByItem(itemId,label,depth===0);
 if(!rec||depth>=maxDepth){if(isCrystal(label))crystalTotals[label]=(crystalTotals[label]||0)+qty;else base[label]=(base[label]||0)+qty;return}
 const f=rec.fields||{},yieldQty=Math.max(1,+f.AmountResult||1),crafts=Math.ceil(qty/yieldQty),ings=f.Ingredient||[],amounts=f.AmountIngredient||[],step={name:label,qty,depth,crystals:[],ingredients:[]};
 for(let i=0;i<ings.length;i++){
   const id=relId(ings[i]),amount=+(amounts[i]||0);if(!id||!amount)continue;const need=crafts*amount,n=await itemName(id);
   if(isCrystal(n)){step.crystals.push({name:n,qty:need});crystalTotals[n]=(crystalTotals[n]||0)+need;continue}
   const crafted=depth+1<maxDepth?await hasRecipe(id):false;step.ingredients.push({name:n,qty:need,crafted});await expandStructured(id,n,need,depth+1,maxDepth,base,steps,crystalTotals);
 }
 steps.push(step);
}
function stepCard(x,maxDepth){return `<article class="recipe-step-card"><div class="recipe-step-head"><div><small>工程 ${Math.min(x.depth+1,maxDepth)}</small><h3>${FF14Tools.esc(x.name)} <span>×${x.qty}</span></h3></div>${x.crystals.length?`<div class="recipe-crystal-row">${x.crystals.map(c=>`<span>${FF14Tools.esc(c.name)} ×${c.qty}</span>`).join('')}</div>`:''}</div><div class="recipe-ingredient-list">${x.ingredients.map(i=>`<div><span>${i.crafted?'中間素材':'素材'}</span><strong>${FF14Tools.esc(i.name)}</strong><b>×${i.qty}</b></div>`).join('')||'<span class="muted-copy">追加素材なし</span>'}</div></article>`}
function pagination(total,current){
  if(total<=1)return '';
  const nums=new Set([1,total,current,current-1,current+1,current-2,current+2]);
  const list=[...nums].filter(n=>n>=1&&n<=total).sort((a,b)=>a-b);
  let html=`<button class="lookup-page-btn" data-page="${current-1}" ${current===1?'disabled':''}>‹</button>`,prev=0;
  for(const n of list){
    if(prev&&n-prev>1)html+='<span class="lookup-page-ellipsis">…</span>';
    html+=`<button class="lookup-page-btn ${n===current?'is-active':''}" data-page="${n}">${n}</button>`;prev=n;
  }
  return html+`<button class="lookup-page-btn" data-page="${current+1}" ${current===total?'disabled':''}>›</button>`;
}
function renderCandidates(page=1){
  const pages=Math.max(1,Math.ceil(candidates.length/PAGE_SIZE));
  candidatePage=Math.max(1,Math.min(page,pages));
  const start=(candidatePage-1)*PAGE_SIZE,rows=candidates.slice(start,start+PAGE_SIZE),nq=norm(currentQuery);
  revealResult(recipeSearchResult);recipeSearchResult.innerHTML=`<div class="lookup-summary"><strong>検索結果 ${candidates.length}件</strong><span>${candidatePage} / ${pages} ページ</span></div>`+
  '<div class="recipe-candidates">'+rows.map((x,i)=>{
    const nm=x.fields?.Name||'',nn=norm(nm),tag=nn===nq?'完全一致':nn.startsWith(nq)?'前方一致':'部分一致';
    return `<button class="recipe-candidate" data-i="${start+i}"><span><strong>${FF14Tools.esc(nm)} <span class="lookup-match">${tag}</span></strong></span><span>選択 →</span></button>`;
  }).join('')+'</div>'+`<div class="lookup-pagination">${pagination(pages,candidatePage)}</div>`;
  recipeSearchResult.querySelectorAll('.recipe-candidate').forEach(b=>b.onclick=()=>calculate(candidates[+b.dataset.i]));
  recipeSearchResult.querySelectorAll('.lookup-page-btn[data-page]').forEach(b=>{if(!b.disabled)b.onclick=()=>renderCandidates(+b.dataset.page)});
}
async function recipeChoiceCard(itemId,label,options){
  const rows=[];
  for(let i=0;i<options.length;i++){
    const f=options[i].fields||{},ings=f.Ingredient||[],amts=f.AmountIngredient||[],parts=[];
    for(let j=0;j<ings.length;j++){
      const id=relId(ings[j]),amount=+(amts[j]||0);if(!id||!amount)continue;
      parts.push(`${await itemName(id)} ×${amount}`);
    }
    rows.push(`<button class="recipe-candidate recipe-variant-btn" data-recipe-index="${i}"><span><strong>${FF14Tools.esc(craftName(f.CraftType))} / 1回で${Math.max(1,+f.AmountResult||1)}個</strong><small>${FF14Tools.esc(parts.join('、')||'素材情報なし')}</small></span><span>この方法を使う →</span></button>`);
  }
  revealResult(recipeSearchResult);
  recipeSearchResult.innerHTML=`<div class="lookup-summary"><strong>${FF14Tools.esc(label)}：製作方法を選択</strong><span>${options.length}候補</span></div><p class="muted-copy">この中間素材には、素材構成が異なる複数の製作方法があります。この場合だけ使用する方法を選択してください。</p><div class="recipe-candidates">${rows.join('')}</div>`;
  recipeSearchResult.querySelectorAll('.recipe-variant-btn').forEach(b=>b.onclick=async()=>{recipeChoice.set(itemId,+b.dataset.recipeIndex);await calculate(activeCandidate)});
}

async function calculate(c){
 activeCandidate=c;
 const qty=Math.max(1,+recipeItemQty.value||1),max=+recipeDepth.value,name=c.fields?.Name||'製作品';
 revealResult(recipeSearchResult);recipeSearchResult.innerHTML=`<h3>${FF14Tools.esc(name)} × ${qty}</h3><p>必要素材を計算しています…</p>`;
 try{
  activeRootCraft=+recipeCraft.value||0;
  const rec=await recipeByItem(c.row_id,name,true);if(!rec){recipeSearchResult.innerHTML='<h3>製作レシピが見つかりませんでした</h3><p>別の候補を選ぶか、アイテム名を少し変えて検索してください。</p>';return}
  const base={},steps=[],crystalTotals={};await expandStructured(c.row_id,name,qty,0,max,base,steps,crystalTotals);steps.sort((a,b)=>a.depth-b.depth);
  recipeSearchResult.innerHTML=`<div class="lookup-summary"><strong>${FF14Tools.esc(name)} × ${qty}</strong><span>${steps.length}工程</span></div><h3>製作の流れ</h3><div class="recipe-step-grid">${steps.map(x=>stepCard(x,max)).join('')}</div>${Object.keys(crystalTotals).length?`<h3 class="recipe-section-title">クリスタル合計</h3><div class="crystal-total-row">${Object.entries(crystalTotals).map(([n,q])=>`<span><strong>${FF14Tools.esc(n)}</strong> × ${q}</span>`).join('')}</div>`:''}<h3 class="recipe-section-title">用意する基礎素材</h3><div class="base-material-grid">${Object.entries(base).map(([n,q])=>`<div class="result-item"><strong>${FF14Tools.esc(n)}</strong><span>× ${q}</span></div>`).join('')}</div>`;
 }catch(e){
   if(e instanceof RootRecipeUnavailable){
     recipeSearchResult.innerHTML=`<h3>${FF14Tools.esc(e.craft)}の製作レシピがありません</h3><p>${FF14Tools.esc(e.label)}は、選択した製作クラスでは製作できません。製作クラスを変更してもう一度検索してください。</p>`;
     return;
   }
   if(e instanceof RecipeChoiceNeeded){await recipeChoiceCard(e.itemId,e.label,e.options);return}
   recipeSearchResult.innerHTML='<h3>計算できませんでした</h3><p>データを取得できなかったため、もう一度実行してください。</p>'
 }
}
recipeItemSearch.onclick=async()=>{
  const q=recipeItemQuery.value.trim();if(!q){revealResult(recipeSearchResult);recipeSearchResult.textContent='アイテム名を入力してください。';return}
  recipeItemSearch.disabled=true;recipeItemSearch.textContent='検索中…';revealResult(recipeSearchResult);recipeSearchResult.textContent='アイテムを検索しています…';
  try{
    currentQuery=q;recipeChoice.clear();activeCandidate=null;candidates=await searchItems(q);candidatePage=1;
    if(!candidates.length){revealResult(recipeSearchResult);recipeSearchResult.innerHTML='<h3>見つかりませんでした</h3><p>名前を短くして検索してみてください。</p>';return}
    const exactMatches=candidates.filter(x=>norm(x.fields?.Name||'')===norm(q));
    if(exactMatches.length===1){
      revealResult(recipeSearchResult);recipeSearchResult.innerHTML='<div class="lookup-loading">完全一致したレシピを確認しています…</div>';
      await calculate(exactMatches[0]);
    }else if(candidates.length===1){
      await calculate(candidates[0]);
    }else{
      renderCandidates(1);
    }
  }catch(e){revealResult(recipeSearchResult);recipeSearchResult.innerHTML='<h3>検索できませんでした</h3><p>時間を置いて、もう一度実行してください。</p>'}
  finally{recipeItemSearch.disabled=false;recipeItemSearch.textContent='検索する'}
};
recipeItemQuery.addEventListener('keydown',e=>{if(e.key==='Enter')recipeItemSearch.click()});
recipeCraft.addEventListener('change',()=>{recipeChoice.clear();activeCandidate=null});
