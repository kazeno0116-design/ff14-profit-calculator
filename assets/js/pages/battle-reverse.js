const GARLAND='https://www.garlandtools.org';
const OFFICIAL_DB='https://jp.finalfantasyxiv.com/lodestone/playguide/db/search/?q=';

function getSearchRows(data){
  if(Array.isArray(data)) return data;
  if(Array.isArray(data?.results)) return data.results;
  if(Array.isArray(data?.items)) return data.items;
  return [];
}
function rowName(r){return r?.obj?.n || r?.name || r?.n || r?.obj?.name || ''}
function rowId(r){return +(r?.obj?.id || r?.obj?.i || r?.id || r?.i || 0)}
function rowType(r){return String(r?.type || r?.obj?.type || r?.obj?.t || '').toLowerCase()}
function looksItem(r){const tp=rowType(r);return !tp || tp.includes('item') || tp==='i'}
function officialSearchUrl(name){return OFFICIAL_DB+encodeURIComponent(name)}

function normalizeSearchText(s){
  return String(s||'').normalize('NFKC').toLocaleLowerCase('ja');
}
function rankRows(rows,query){
  const q=normalizeSearchText(query);
  const seen=new Set();
  return rows
    .filter(looksItem)
    .filter(x=>rowId(x))
    .filter(x=>{
      const id=rowId(x);
      if(seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .filter(x=>normalizeSearchText(rowName(x)).includes(q))
    .sort((a,b)=>{
      const an=normalizeSearchText(rowName(a)),bn=normalizeSearchText(rowName(b));
      const ae=an===q?0:an.startsWith(q)?1:2;
      const be=bn===q?0:bn.startsWith(q)?1:2;
      if(ae!==be) return ae-be;
      if(an.length!==bn.length) return an.length-bn.length;
      return an.localeCompare(bn,'ja');
    });
}

function collectInstanceRefs(node,path='',out=[]){
  if(node==null) return out;
  if(Array.isArray(node)){
    node.forEach((v,i)=>collectInstanceRefs(v,path+'['+i+']',out));
    return out;
  }
  if(typeof node!=='object') return out;
  for(const [k,v] of Object.entries(node)){
    const p=path?path+'.'+k:k;
    if(/instance/i.test(k)){
      if(Array.isArray(v)){
        v.forEach(x=>{
          if(typeof x==='number') out.push({id:x,path:p});
          else if(typeof x==='string' && x.trim()) out.push({name:x.trim(),path:p});
          else if(x && typeof x==='object'){
            const id=+(x.id||x.i||x.instanceId||x.instance_id||0);
            const name=x.name||x.n||x.instanceName||x.instance_name||'';
            if(id||name) out.push({id,name,path:p,raw:x});
          }
        });
      } else if(typeof v==='number') out.push({id:v,path:p});
      else if(typeof v==='string' && v.trim()) out.push({name:v.trim(),path:p});
      else if(v && typeof v==='object'){
        const id=+(v.id||v.i||v.instanceId||v.instance_id||0);
        const name=v.name||v.n||v.instanceName||v.instance_name||'';
        if(id||name) out.push({id,name,path:p,raw:v});
      }
    }
    collectInstanceRefs(v,p,out);
  }
  return out;
}

function collectSourceText(node,path='',out=[]){
  if(node==null) return out;
  if(Array.isArray(node)){node.forEach((v,i)=>collectSourceText(v,path+'['+i+']',out));return out}
  if(typeof node!=='object') return out;
  for(const [k,v] of Object.entries(node)){
    const p=path?path+'.'+k:k;
    if(/source|drop|reward|loot|shop|exchange|recipe|quest/i.test(k)){
      if(typeof v==='string' && v.trim()) out.push(v.trim());
      if(Array.isArray(v)){
        v.forEach(x=>{
          if(typeof x==='string'&&x.trim()) out.push(x.trim());
          else if(x&&typeof x==='object'){
            for(const key of ['name','n','text','source']){
              if(typeof x[key]==='string'&&x[key].trim()) out.push(x[key].trim());
            }
          }
        });
      }
    }
    collectSourceText(v,p,out);
  }
  return out;
}

async function loadItem(id){
  const r=await fetch(`${GARLAND}/db/doc/item/ja/3/${id}.json`);
  if(!r.ok) throw new Error('アイテム詳細を取得できませんでした');
  return r.json();
}
const instanceCache=new Map();
async function instanceName(id){
  if(instanceCache.has(id)) return instanceCache.get(id);
  try{
    const r=await fetch(`${GARLAND}/db/doc/instance/ja/2/${id}.json`);
    if(!r.ok){instanceCache.set(id,'');return ''}
    const d=await r.json();
    const n=d?.instance?.name || d?.instance?.n || d?.name || '';
    instanceCache.set(id,n);
    return n;
  }catch{
    instanceCache.set(id,'');
    return '';
  }
}

function instanceCategory(name){
  const raid=[
    '大迷宮バハムート','機工城アレキサンダー','次元の狭間オメガ',
    '希望の園エデン','万魔殿パンデモニウム','至天の座アルカディア'
  ];
  const alliance=[
    'クリスタルタワー','古代の民の迷宮','シルクスの塔','闇の世界',
    '魔航船ヴォイドアーク','禁忌都市マハ','影の国ダン・スカー',
    '失われた都ラバナスタ','封じられた聖塔 リドルアナ','楽欲の僧院 オーボンヌ',
    '複製サレタ工場廃墟','人形タチノ軍事基地','希望ノ砲台：「塔」',
    '輝ける神域 アグライア','喜びの神域 エウプロシュネ','華めく神域 タレイア',
    'ジュノ：ザ・ファーストウォーク','サンドリア：ザ・セカンドウォーク','ウィンダス：ザ・サードウォーク'
  ];
  if(raid.some(x=>name.includes(x))) return 'レイド';
  if(alliance.some(x=>name.includes(x))) return 'アライアンスレイド';
  if(/討滅戦|征竜戦|神龍|極/.test(name)) return '討滅戦';
  if(/レイド/.test(name)) return 'レイド';
  return 'ID・コンテンツ';
}

function methodFromPath(path){
  const p=String(path||'').toLowerCase();
  if(/chest|treasure/.test(p)) return '宝箱から入手';
  if(/loot|drop/.test(p)) return '宝箱・戦利品から入手';
  if(/reward/.test(p)) return 'コンテンツ報酬として入手';
  return 'コンテンツ内の宝箱・戦利品から入手';
}

function usefulExtraSources(values){
  return [...new Set(values)]
    .map(x=>String(x).trim())
    .filter(x=>x && x.length<=90)
    .filter(x=>!/^https?:/i.test(x))
    .filter(x=>!/^[\d\s,.\-]+$/.test(x))
    .filter(x=>!/^(item|instance|source|drop|loot|reward)$/i.test(x))
    .slice(0,6);
}

async function acquisitionForRow(row){
  const id=rowId(row),name=rowName(row)||('Item '+id);
  if(!id) return {id,name,sources:[],error:'アイテムIDを取得できませんでした'};
  try{
    const data=await loadItem(id);
    let refs=collectInstanceRefs(data);
    const uniq=new Map();
    for(const r of refs){
      const key=(r.id||'')+'|'+(r.name||'');
      if(!uniq.has(key)) uniq.set(key,r);
    }
    refs=[...uniq.values()].slice(0,12);
    for(const r of refs){
      if(r.id&&!r.name) r.name=await instanceName(r.id);
    }
    refs=refs.filter(r=>r.name);

    const sources=refs.map(r=>({
      category:instanceCategory(r.name),
      title:r.name,
      method:methodFromPath(r.path),
      official:officialSearchUrl(r.name)
    }));

    const extras=usefulExtraSources(collectSourceText(data));
    extras.forEach(x=>sources.push({
      category:/交換|ショップ|店|通貨/.test(x)?'交換・購入':
               /製作|レシピ/.test(x)?'製作':
               /クエスト/.test(x)?'クエスト':'その他',
      title:x,
      method:'取得情報',
      official:officialSearchUrl(name)
    }));

    return {id,name,sources,official:officialSearchUrl(name)};
  }catch(e){
    return {id,name,sources:[],official:officialSearchUrl(name),error:e.message};
  }
}

const PAGE_SIZE=12;
let lookupRows=[];
let lookupPage=1;
let lookupQuery='';

function pageButtons(current,total){
  if(total<=1) return '';
  const wanted=new Set([1,total,current,current-1,current+1,current-2,current+2]);
  const nums=[...wanted].filter(n=>n>=1&&n<=total).sort((a,b)=>a-b);
  let out=`<button class="lookup-page-btn" data-page="${current-1}" ${current===1?'disabled':''}>‹</button>`;
  let prev=0;
  for(const n of nums){
    if(prev&&n-prev>1) out+='<span class="lookup-page-ellipsis">…</span>';
    out+=`<button class="lookup-page-btn ${n===current?'is-active':''}" data-page="${n}">${n}</button>`;
    prev=n;
  }
  out+=`<button class="lookup-page-btn" data-page="${current+1}" ${current===total?'disabled':''}>›</button>`;
  return out;
}

function sourceHtml(s){
  return `<div class="acquisition-source">
    <div class="acquisition-source-head">
      <span class="acquisition-category">${FF14Tools.esc(s.category)}</span>
      <strong>${FF14Tools.esc(s.title)}</strong>
    </div>
    <div class="acquisition-method">${FF14Tools.esc(s.method)}</div>
    ${s.official?`<a href="${s.official}" target="_blank" rel="noopener">日本語の公式DBで確認 →</a>`:''}
  </div>`;
}

function itemHtml(item){
  const sourceBody=item.sources.length
    ? `<div class="acquisition-list">${item.sources.map(sourceHtml).join('')}</div>`
    : `<div class="acquisition-none">入手方法を自動取得できませんでした。公式データベースで確認してください。</div>`;
  return `<article class="acquisition-item">
    <div class="acquisition-item-head">
      <div><small>ITEM</small><h3>${FF14Tools.esc(item.name)}</h3></div>
      <a class="official-item-link" href="${item.official}" target="_blank" rel="noopener">公式DB →</a>
    </div>
    ${sourceBody}
  </article>`;
}

async function renderLookupPage(page=1){
  if(!lookupRows.length){
    dropResult.innerHTML='<h3>候補がありません</h3><p>別の文字列で検索してください。</p>';
    return;
  }
  const pages=Math.max(1,Math.ceil(lookupRows.length/PAGE_SIZE));
  lookupPage=Math.min(Math.max(1,page),pages);
  const begin=(lookupPage-1)*PAGE_SIZE;
  const rows=lookupRows.slice(begin,begin+PAGE_SIZE);

  dropResult.innerHTML=`<div class="lookup-summary"><strong>「${FF14Tools.esc(lookupQuery)}」：${lookupRows.length}件</strong><span>${lookupPage} / ${pages} ページ</span></div>
    <div class="lookup-loading">このページの入手方法を確認しています…</div>`;

  const items=[];
  // modest concurrency to avoid excessive requests
  for(let i=0;i<rows.length;i+=4){
    const part=await Promise.all(rows.slice(i,i+4).map(acquisitionForRow));
    items.push(...part);
  }

  dropResult.innerHTML=`<div class="lookup-summary"><strong>「${FF14Tools.esc(lookupQuery)}」：${lookupRows.length}件</strong><span>${lookupPage} / ${pages} ページ</span></div>
    <div class="acquisition-items">${items.map(itemHtml).join('')}</div>
    <div class="lookup-pagination">${pageButtons(lookupPage,pages)}</div>`;

  dropResult.querySelectorAll('.lookup-page-btn[data-page]').forEach(b=>{
    if(!b.disabled)b.onclick=()=>{
      renderLookupPage(+b.dataset.page);
      dropResult.scrollIntoView({behavior:'smooth',block:'start'});
    };
  });
}

dropSearch.onclick=async()=>{
  const q=dropItemName.value.trim();
  if(!q){dropResult.textContent='アイテム名または名前の一部を入力してください。';return}
  dropSearch.disabled=true;
  dropSearch.textContent='検索中…';
  dropResult.textContent='一致するアイテムを検索しています…';
  try{
    const r=await fetch(`${GARLAND}/api/search.php?text=${encodeURIComponent(q)}&lang=ja`);
    if(!r.ok) throw new Error('検索データへ接続できませんでした');
    lookupQuery=q;
    lookupRows=rankRows(getSearchRows(await r.json()),q);
    lookupPage=1;
    if(!lookupRows.length) throw new Error('一致するアイテムが見つかりませんでした');
    await renderLookupPage(1);
  }catch(e){
    lookupRows=[];
    dropResult.innerHTML=`<h3>検索できませんでした</h3><p>${FF14Tools.esc(e.message)}</p>
      <div class="tool-actions"><a class="tool-btn secondary" target="_blank" rel="noopener" href="${officialSearchUrl(q)}">日本語の公式DBで検索</a></div>`;
  }finally{
    dropSearch.disabled=false;
    dropSearch.textContent='入手方法を検索';
  }
};
dropItemName.addEventListener('keydown',e=>{if(e.key==='Enter')dropSearch.click()});