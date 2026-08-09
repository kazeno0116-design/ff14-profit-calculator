const API='https://v2.xivapi.com/api';
const PAGE_SIZE=20;
let candidates=[],candidatePage=1,currentQuery='';
const nameCache=new Map(),recipeCache=new Map();

function escq(s){return String(s).replaceAll('\\','\\\\').replaceAll('"','\\"')}
function norm(s){return String(s||'').normalize('NFKC').toLocaleLowerCase('ja')}
function relId(v){if(v==null)return 0;if(typeof v==='number')return v;return +(v.row_id||v.value||v.id||v.ID||0)}
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
async function recipeByItem(id){
  if(recipeCache.has(id))return recipeCache.get(id);
  const q=encodeURIComponent('ItemResult='+id);
  const d=await fetchJson(`${API}/search?sheets=Recipe&language=ja&limit=20&fields=AmountIngredient,AmountResult,Ingredient,ItemResult.Name&query=${q}`);
  const r=(d.results||[])[0]||null;recipeCache.set(id,r);return r;
}
async function expand(itemId,label,qty,depth,maxDepth,base,tree){
  const rec=await recipeByItem(itemId);
  tree.push({name:label,qty,depth,crafted:!!rec});
  if(!rec||depth>=maxDepth){base[label]=(base[label]||0)+qty;return}
  const f=rec.fields||{},yieldQty=Math.max(1,+f.AmountResult||1),crafts=Math.ceil(qty/yieldQty);
  const ings=f.Ingredient||[],amounts=f.AmountIngredient||[];
  let used=0;
  for(let i=0;i<ings.length;i++){
    const id=relId(ings[i]),amount=+(amounts[i]||0);
    if(!id||!amount)continue;
    used++;
    const n=await itemName(id);
    await expand(id,n,crafts*amount,depth+1,maxDepth,base,tree);
  }
  if(!used)base[label]=(base[label]||0)+qty;
}
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
  recipeSearchResult.innerHTML=`<div class="lookup-summary"><strong>検索結果 ${candidates.length}件</strong><span>${candidatePage} / ${pages} ページ</span></div>`+
  '<div class="recipe-candidates">'+rows.map((x,i)=>{
    const nm=x.fields?.Name||'',nn=norm(nm),tag=nn===nq?'完全一致':nn.startsWith(nq)?'前方一致':'部分一致';
    return `<button class="recipe-candidate" data-i="${start+i}"><span><strong>${FF14Tools.esc(nm)} <span class="lookup-match">${tag}</span></strong></span><span>選択 →</span></button>`;
  }).join('')+'</div>'+`<div class="lookup-pagination">${pagination(pages,candidatePage)}</div>`;
  recipeSearchResult.querySelectorAll('.recipe-candidate').forEach(b=>b.onclick=()=>calculate(candidates[+b.dataset.i]));
  recipeSearchResult.querySelectorAll('.lookup-page-btn[data-page]').forEach(b=>{if(!b.disabled)b.onclick=()=>renderCandidates(+b.dataset.page)});
}
async function calculate(c){
  const qty=Math.max(1,+recipeItemQty.value||1),max=+recipeDepth.value,name=c.fields?.Name||'製作品';
  recipeSearchResult.innerHTML=`<h3>${FF14Tools.esc(name)} × ${qty}</h3><p>必要素材を計算しています…</p>`;
  try{
    const rec=await recipeByItem(c.row_id);
    if(!rec){recipeSearchResult.innerHTML='<h3>製作レシピが見つかりませんでした</h3><p>別の候補を選ぶか、アイテム名を少し変えて検索してください。</p>';return}
    const base={},tree=[];
    await expand(c.row_id,name,qty,0,max,base,tree);
    recipeSearchResult.innerHTML=`<div class="lookup-summary"><strong>${FF14Tools.esc(name)} × ${qty}</strong><span>必要素材</span></div>`+
      '<h3>製作の流れ</h3><div class="recipe-tree">'+tree.map(x=>`<div class="recipe-line"><span class="depth" style="--depth:${x.depth}">${x.crafted?'◆ ':'・ '}${FF14Tools.esc(x.name)}</span><strong>×${x.qty}</strong></div>`).join('')+'</div>'+
      '<h3 style="margin-top:16px">用意する素材</h3><div class="result-list">'+Object.entries(base).map(([n,q])=>`<div class="result-item"><strong>${FF14Tools.esc(n)}</strong><span>× ${q}</span></div>`).join('')+'</div>';
  }catch(e){recipeSearchResult.innerHTML='<h3>計算できませんでした</h3><p>データを取得できなかったため、もう一度実行してください。</p>'}
}
recipeItemSearch.onclick=async()=>{
  const q=recipeItemQuery.value.trim();if(!q){recipeSearchResult.textContent='アイテム名を入力してください。';return}
  recipeItemSearch.disabled=true;recipeItemSearch.textContent='検索中…';recipeSearchResult.textContent='アイテムを検索しています…';
  try{
    currentQuery=q;candidates=await searchItems(q);candidatePage=1;
    if(!candidates.length){recipeSearchResult.innerHTML='<h3>見つかりませんでした</h3><p>名前を短くして検索してみてください。</p>';return}
    const exactMatches=candidates.filter(x=>norm(x.fields?.Name||'')===norm(q));
    if(exactMatches.length===1){
      recipeSearchResult.innerHTML='<div class="lookup-loading">完全一致したレシピを確認しています…</div>';
      await calculate(exactMatches[0]);
    }else if(candidates.length===1){
      await calculate(candidates[0]);
    }else{
      renderCandidates(1);
    }
  }catch(e){recipeSearchResult.innerHTML='<h3>検索できませんでした</h3><p>時間を置いて、もう一度実行してください。</p>'}
  finally{recipeItemSearch.disabled=false;recipeItemSearch.textContent='検索する'}
};
recipeItemQuery.addEventListener('keydown',e=>{if(e.key==='Enter')recipeItemSearch.click()});