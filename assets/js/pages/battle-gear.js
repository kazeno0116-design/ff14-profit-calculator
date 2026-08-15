(() => {
  const params=new URLSearchParams(location.search);
  const selectedType=params.get('type')||'';
  const selectedContent=params.get('content')||'';
  const typeNames={extreme:'極',savage:'零式',ultimate:'絶'};
  const contentTitleEl=document.getElementById('gearContentTitle');
  const contentTextEl=document.getElementById('gearContentText');
  const dataHeadingEl=document.getElementById('gearDataHeading');
  const dataDescriptionEl=document.getElementById('gearDataDescription');

  const ultimateRules={
    '絶バハムート討滅戦':{slug:'ucob',sync:345,level:70},
    '絶アルテマウェポン破壊作戦':{slug:'uwu',sync:375,level:70},
    '絶アレキサンダー討滅戦':{slug:'tea',sync:475,level:80},
    '絶竜詩戦争':{slug:'dsr',sync:605,level:90},
    '絶オメガ検証戦':{slug:'top',sync:635,level:90},
    '絶もうひとつの未来':{slug:'fru',sync:735,level:100},
    '絶妖星乱舞':{slug:null,sync:null,level:100,current:true}
  };
  const ultimateRule=selectedType==='ultimate'?ultimateRules[selectedContent]:null;
  const mode=(selectedType==='ultimate'&&ultimateRule&&!ultimateRule.current)?'ultimate':'current';
  const selectedHasGear=!selectedContent || selectedType==='extreme' || selectedType==='savage' || (selectedType==='ultimate'&&!!ultimateRule);

  if(selectedContent){
    contentTitleEl.textContent=selectedContent;
    dataHeadingEl.textContent=`${selectedContent}向け装備`;
    if(selectedType==='ultimate'&&ultimateRule&&!ultimateRule.current){
      contentTextEl.textContent=`絶「${selectedContent}」はIL${ultimateRule.sync}のアイテムレベルシンク対象です。レベルシンク後のサブステータスまで考慮したコンテンツ専用BiSをジョブ別に表示します。`;
      dataDescriptionEl.textContent=`このコンテンツでは現行の高IL装備をそのまま使うのではなく、IL${ultimateRule.sync}シンクを前提にした専用装備構成を表示します。装備名・食事・マテリアは日本語名で表示します。`;
    }else if(selectedType==='ultimate'&&ultimateRule?.current){
      contentTextEl.textContent=`絶「${selectedContent}」はPatch 7.55公式データベース上でアイテムレベルシンクの記載がないため、現行パッチの最新装備を表示します。`;
      dataDescriptionEl.textContent='アイテムレベルシンクがないため、このコンテンツ専用の旧装備セットは持たず、現行パッチの最新装備データを共通利用します。';
    }else if(selectedType==='extreme'||selectedType==='savage'){
      contentTextEl.textContent=`${typeNames[selectedType]}「${selectedContent}」を現在挑戦する場合の現行パッチ最新装備を表示します。アイテムレベルシンクがないコンテンツは共通の最新装備データを利用します。`;
      dataDescriptionEl.textContent='極・零式などでアイテムレベルシンクがない場合は、コンテンツごとに古い装備を複製せず、現行パッチの最新装備を共通表示します。';
    }
  }

  const XIVAPI='https://v2.xivapi.com/api';
  const STATIC='https://raw.githubusercontent.com/xiv-gear-planner/static-bis-sets/main';
  const XGAPI='https://api.xivgear.app/basedata';

  const roles={
    tank:{name:'タンク',jobs:[['pld','PLD','ナイト'],['war','WAR','戦士'],['drk','DRK','暗黒騎士'],['gnb','GNB','ガンブレイカー']]},
    healer:{name:'ヒーラー',jobs:[['whm','WHM','白魔道士'],['sch','SCH','学者'],['ast','AST','占星術師'],['sge','SGE','賢者']]},
    melee:{name:'近接物理DPS',jobs:[['mnk','MNK','モンク'],['drg','DRG','竜騎士'],['nin','NIN','忍者'],['sam','SAM','侍'],['rpr','RPR','リーパー'],['vpr','VPR','ヴァイパー']]},
    ranged:{name:'遠隔物理DPS',jobs:[['brd','BRD','吟遊詩人'],['mch','MCH','機工士'],['dnc','DNC','踊り子']]},
    caster:{name:'遠隔魔法DPS',jobs:[['blm','BLM','黒魔道士'],['smn','SMN','召喚士'],['rdm','RDM','赤魔道士'],['pct','PCT','ピクトマンサー']]}
  };

  const staticJobs=new Set(['pld','war','drk','gnb','sch','sge','drg','nin','sam','rpr','vpr','dnc','rdm']);
  const externalCurrent={
    whm:{url:'https://xivgear.app/?onlySetIndex=1&page=embed%7Csl%7C71fd4206-049f-4017-b855-987559fb0567',name:'2.41 GCD・レリック武器',source:'Icy Veins',patch:'7.55'},
    ast:{url:'https://xivgear.app/?onlySetIndex=18&page=embed%7Csl%7C8dfb3a83-2dee-4fa4-a33a-d7c3b91ac4fe',name:'2.42 GCD・レリック武器',source:'Icy Veins',patch:'7.55'},
    mnk:{url:'https://xivgear.app/?page=embed%7Csl%7C918a7b79-48a3-4fa5-b230-b18d1274c27d',name:'1.94 GCD・レリック武器',source:'Icy Veins',patch:'7.55'},
    brd:{url:'https://xivgear.app/?onlySetIndex=1&page=embed%7Csl%7Cdcb3d409-c4b3-422a-9bd6-6f821e5a99eb',name:'IL790・レリック武器',source:'Icy Veins',patch:'7.55'},
    mch:{url:'https://xivgear.app/?page=embed%7Csl%7C39a8fcce-42db-4728-bd0d-000edf342e91',name:'IL790・レリック武器',source:'Icy Veins',patch:'7.55'},
    blm:{url:'https://xivgear.app/?onlySetIndex=22&page=embed%7Csl%7C36373602-51ae-4ade-b708-d504fd75ad66',name:'2.50 GCD・キャスター共用／レリック武器',source:'Icy Veins',patch:'7.55'},
    smn:{url:'https://xivgear.app/?page=sl%7C36f16064-f99d-4211-9eca-6c387aee0ee1',name:'2.48 GCD・レリック武器',source:'Icy Veins',patch:'7.55'},
    pct:{url:'https://xivgear.app/?onlySetIndex=1&page=sl%7C2de78579-bfee-4f1c-88a2-a75bd4426ba6',name:'2.50 GCD・レリック武器',source:'Icy Veins',patch:'7.55'}
  };

  const balanceSlug={pld:'tanks/paladin',war:'tanks/warrior',drk:'tanks/dark-knight',gnb:'tanks/gunbreaker',whm:'healers/white-mage',sch:'healers/scholar',ast:'healers/astrologian',sge:'healers/sage',mnk:'melee/monk',drg:'melee/dragoon',nin:'melee/ninja',sam:'melee/samurai',rpr:'melee/reaper',vpr:'melee/viper',brd:'ranged/bard',mch:'ranged/machinist',dnc:'ranged/dancer',blm:'casters/black-mage',smn:'casters/summoner',rdm:'casters/red-mage',pct:'casters/pictomancer'};
  const icySlug={pld:'paladin-pve-tank-gear-best-in-slot',war:'warrior-pve-tank-gear-best-in-slot',drk:'dark-knight-pve-tank-gear-best-in-slot',gnb:'gunbreaker-pve-tank-gear-best-in-slot',whm:'white-mage-pve-healer-gear-best-in-slot',sch:'scholar-pve-healer-gear-best-in-slot',ast:'astrologian-pve-healer-gear-best-in-slot',sge:'sage-pve-healer-gear-best-in-slot',mnk:'monk-pve-dps-gear-best-in-slot',drg:'dragoon-pve-dps-gear-best-in-slot',nin:'ninja-pve-dps-gear-best-in-slot',sam:'samurai-pve-dps-gear-best-in-slot',rpr:'reaper-pve-dps-gear-best-in-slot',vpr:'viper-pve-dps-gear-best-in-slot',brd:'bard-pve-dps-gear-best-in-slot',mch:'machinist-pve-dps-gear-best-in-slot',dnc:'dancer-pve-dps-gear-best-in-slot',blm:'black-mage-pve-dps-gear-best-in-slot',smn:'summoner-pve-dps-gear-best-in-slot',rdm:'red-mage-pve-dps-gear-best-in-slot',pct:'pictomancer-pve-dps-gear-best-in-slot'};
  const slotNames={Weapon:'武器',OffHand:'盾・副武器',Head:'頭',Body:'胴',Hand:'手',Hands:'手',Legs:'脚',Feet:'足',Ears:'耳',Neck:'首',Wrist:'腕',RingLeft:'指輪1',RingRight:'指輪2'};
  const slotOrder=['Weapon','OffHand','Head','Body','Hand','Hands','Legs','Feet','Ears','Neck','Wrist','RingLeft','RingRight'];

  const itemCache=new Map();
  let sheet=null;
  let activeMeta={patch:'7.55',source:'XivGear Static BiS',mode:'current'};

  const roleEl=document.getElementById('gearRole'),jobEl=document.getElementById('gearJob'),stageEl=document.getElementById('gearStage'),setEl=document.getElementById('gearSet'),statusEl=document.getElementById('gearStatus'),resultEl=document.getElementById('gearResult'),sourcesEl=document.getElementById('gearSources');
  const esc=v=>FF14Tools.esc(String(v??''));
  function allJobs(){return Object.values(roles).flatMap(r=>r.jobs)}
  function jobMeta(key){return allJobs().find(j=>j[0]===key)}
  function fillRoles(){roleEl.innerHTML=Object.entries(roles).map(([k,r])=>`<option value="${k}">${r.name}</option>`).join('')}
  function fillJobs(){const r=roles[roleEl.value];jobEl.innerHTML=r.jobs.map(j=>`<option value="${j[0]}">${j[2]}</option>`).join('')}
  function fillStages(job){
    if(mode==='ultimate'){
      stageEl.innerHTML='<option value="ultimate">コンテンツ専用BiS</option>';
      stageEl.disabled=true;
      return;
    }
    if(selectedContent){
      stageEl.innerHTML='<option value="current">現行パッチ最新装備</option>';
      stageEl.disabled=true;
      return;
    }
    const current='<option value="current">最終装備</option>';
    const prog=staticJobs.has(job)?'<option value="prog">攻略開始（零式実装時）</option>':'';
    stageEl.innerHTML=current+prog;
    stageEl.value='current';
    stageEl.disabled=false;
  }

  function ultimateXivGearUrl(job,slug){return `https://xivgear.app/?page=bis%7C${encodeURIComponent(job)}%7Cultimate%7C${encodeURIComponent(slug)}`}

  function sourceLinks(job){
    const meta=jobMeta(job),bal=balanceSlug[job],icy=icySlug[job];
    const links=[];
    if(mode==='ultimate'&&ultimateRule){
      links.push(`<a href="${ultimateXivGearUrl(job,ultimateRule.slug)}" target="_blank" rel="noopener"><strong>XivGear</strong><span>${esc(meta[2])} / ${esc(selectedContent)} の専用BiSを確認 →</span></a>`);
      links.push(`<a href="https://www.thebalanceffxiv.com/jobs/${bal}/best-in-slot/" target="_blank" rel="noopener"><strong>The Balance</strong><span>${esc(meta[2])}の装備ガイドを確認 →</span></a>`);
      if(staticJobs.has(job))links.push(`<a href="https://github.com/xiv-gear-planner/static-bis-sets/tree/main/${job}/ultimate" target="_blank" rel="noopener"><strong>XivGear Static BiS</strong><span>絶専用JSONの更新履歴を確認 →</span></a>`);
    }else{
      links.push(`<a href="https://www.icy-veins.com/ffxiv/${icy}" target="_blank" rel="noopener"><strong>Icy Veins</strong><span>${esc(meta[2])}の7.55装備ガイドを確認 →</span></a>`);
      links.push(`<a href="https://www.thebalanceffxiv.com/jobs/${bal}/best-in-slot/" target="_blank" rel="noopener"><strong>The Balance</strong><span>${esc(meta[2])}の装備ガイドを確認 →</span></a>`);
      if(staticJobs.has(job))links.push(`<a href="https://github.com/xiv-gear-planner/static-bis-sets/tree/main/${job}" target="_blank" rel="noopener"><strong>XivGear Static BiS</strong><span>公開JSONの更新履歴を確認 →</span></a>`);
    }
    sourcesEl.innerHTML=links.join('');
  }

  async function itemName(id){
    if(itemCache.has(id))return itemCache.get(id);
    try{
      const r=await fetch(`${XIVAPI}/sheet/Item/${id}?language=ja&fields=Name,LevelItem`);
      if(!r.ok)throw 0;
      const d=await r.json(),v={name:d.fields?.Name||`アイテム ${id}`,ilvl:d.fields?.LevelItem?.value||d.fields?.LevelItem?.row_id||d.fields?.LevelItem||''};
      itemCache.set(id,v);return v;
    }catch{
      const v={name:`アイテム ${id}`,ilvl:''};itemCache.set(id,v);return v;
    }
  }

  function normalizeSheet(data, fallbackName){
    if(!data)return {sets:[]};
    if(Array.isArray(data.sets))return data;
    if(data.sheet && Array.isArray(data.sheet.sets))return data.sheet;
    if(data.data && Array.isArray(data.data.sets))return data.data;
    if(data.export && Array.isArray(data.export.sets))return data.export;
    if(data.items && typeof data.items==='object')return {sets:[{name:data.name||fallbackName||'装備構成',items:data.items,food:data.food,description:data.description}]};
    if(data.set && data.set.items)return {sets:[data.set]};
    return {sets:[]};
  }

  function validSets(data){return (data?.sets||[]).filter(x=>!x.isSeparator&&x.items&&Object.keys(x.items).length)}

  async function fetchBasedata(url,fallbackName){
    const r=await fetch(`${XGAPI}?url=${encodeURIComponent(url)}`,{cache:'no-store'});
    if(!r.ok)throw new Error('XivGear API error');
    const normalized=normalizeSheet(await r.json(),fallbackName);
    if(!validSets(normalized).length)throw new Error('no sets');
    return normalized;
  }

  async function fetchExternal(job){
    const cfg=externalCurrent[job];
    if(!cfg)throw new Error('external set missing');
    const normalized=await fetchBasedata(cfg.url,cfg.name);
    const sets=validSets(normalized);
    if(sets.length===1)sets[0]={...sets[0],name:cfg.name};
    activeMeta={patch:cfg.patch,source:cfg.source,mode:'current'};
    return {...normalized,sets};
  }

  async function fetchUltimate(job){
    if(!ultimateRule?.slug)throw new Error('ultimate rule missing');
    const slug=ultimateRule.slug;
    if(staticJobs.has(job)){
      try{
        const r=await fetch(`${STATIC}/${job}/ultimate/${slug}.json`,{cache:'no-store'});
        if(r.ok){
          const data=await r.json();
          if(validSets(data).length){
            activeMeta={patch:'7.55',source:'XivGear Static BiS',mode:'ultimate',sync:ultimateRule.sync};
            return data;
          }
        }
      }catch{}
    }
    // Static BiS に専用ファイルがないジョブは、XivGear の公開BiS URLを公式 basedata API で取得する。
    const url=ultimateXivGearUrl(job,slug);
    const normalized=await fetchBasedata(url,`${selectedContent} 専用BiS`);
    activeMeta={patch:'7.55',source:'XivGear Ultimate BiS',mode:'ultimate',sync:ultimateRule.sync};
    return normalized;
  }

  async function load(){
    const job=jobEl.value,stage=stageEl.value,meta=jobMeta(job);
    sourceLinks(job);resultEl.innerHTML='';setEl.innerHTML='';
    if(!selectedHasGear){
      [roleEl,jobEl,stageEl,setEl].forEach(el=>el.disabled=true);
      statusEl.innerHTML=`<strong>${esc(selectedContent)}</strong>の装備データは未登録です。`;
      return;
    }
    statusEl.textContent='装備データを取得しています…';
    try{
      if(mode==='ultimate'){
        sheet=await fetchUltimate(job);
      }else if(staticJobs.has(job)){
        const useStage=selectedContent?'current':stage;
        const r=await fetch(`${STATIC}/${job}/${useStage}.json`,{cache:'no-store'});
        if(!r.ok)throw new Error();
        sheet=await r.json();
        activeMeta={patch:'7.55',source:'XivGear Static BiS',mode:'current'};
      }else{
        sheet=await fetchExternal(job);
      }
      const sets=validSets(sheet);
      if(!sets.length)throw new Error();
      setEl.innerHTML=sets.map((x,i)=>`<option value="${i}">${esc(localizeSetName(x.name))}</option>`).join('');
      const stageLabel=mode==='ultimate'?`${selectedContent}専用BiS`:(selectedContent?'現行パッチ最新装備':(stageEl.value==='prog'?'攻略開始':'最終装備'));
      statusEl.innerHTML=`<strong>${esc(meta[2])}</strong> / ${esc(stageLabel)} ・ ${sets.length}構成`;
      await renderSet();
    }catch(e){
      sheet=null;
      const label=mode==='ultimate'?`${selectedContent}専用BiS`:'現行パッチ最新装備';
      statusEl.innerHTML=`<strong>${esc(meta[2])}</strong>の${esc(label)}を取得できませんでした。下の情報源から最新データを確認してください。`;
    }
  }

  function localizeSetName(n){
    return String(n||'装備構成')
      .replace(/The Unending Coil of Bahamut|UCoB/gi,'絶バハムート')
      .replace(/The Weapon'?s Refrain|UWU/gi,'絶アルテマウェポン')
      .replace(/The Epic of Alexander|TEA/gi,'絶アレキサンダー')
      .replace(/Dragonsong'?s Reprise|DSR/gi,'絶竜詩')
      .replace(/The Omega Protocol|TOP/gi,'絶オメガ')
      .replace(/Futures Rewritten|FRU/gi,'絶もうひとつの未来')
      .replace(/Best[- ]?in[- ]?Slot|\bBiS\b/gi,'最終装備')
      .replace(/Relic Weapon|Relic/gi,'レリック武器')
      .replace(/Savage Weapon/gi,'零式武器')
      .replace(/Savage/gi,'零式')
      .replace(/Palazzo Weapon|Ultimate Weapon/gi,'絶武器')
      .replace(/Crafted/gi,'新式')
      .replace(/Week\s*1/gi,'1週目')
      .replace(/Week/gi,'週')
      .replace(/Tomes?|Tomestone/gi,'トークン')
      .replace(/Max DPS/gi,'最大火力')
      .replace(/Max iLvl/gi,'最大IL')
      .replace(/High Crit/gi,'クリティカル重視')
      .replace(/High Sp(?:ell)?s?peed|High SpS/gi,'スペルスピード重視')
      .replace(/\bCrit\b/gi,'クリティカル')
      .replace(/\bDET\b/gi,'意思力')
      .replace(/\bDH(?:it)?\b/gi,'ダイレクトヒット')
      .replace(/\bSpS\b/gi,'スペルスピード')
      .replace(/\bSkS\b/gi,'スキルスピード')
      .replace(/Omni[- ]?caster/gi,'キャスター共用')
      .replace(/Tome Gloves/gi,'トークン手')
      .replace(/Raid Gloves/gi,'零式手')
      .replace(/Slow/gi,'低速')
      .replace(/Fast/gi,'高速')
      .replace(/Weapon/gi,'武器')
      .replace(/with/gi,'＋')
      .replace(/without/gi,'なし')
      .replace(/Base/gi,'基本構成');
  }

  function materiaIds(arr){
    if(!Array.isArray(arr))return [];
    const ids=[];
    for(const x of arr){const id=typeof x==='number'?x:(x?.id||x?.itemId||x?.materiaId);if(id)ids.push(id)}
    return ids;
  }
  async function materiaText(arr){const ids=materiaIds(arr);if(!ids.length)return '—';const names=[];for(const id of ids)names.push((await itemName(id)).name);return names.join(' / ')||'—'}
  function itemId(it){return it?.id||it?.itemId||it?.item?.id||0}
  function foodId(set){return typeof set.food==='number'?set.food:(set.food?.id||set.food?.itemId||set.foodItemId||0)}

  async function renderSet(){
    if(!sheet)return;
    const sets=validSets(sheet),set=sets[+setEl.value||0];
    if(!set)return;
    statusEl.textContent='日本語装備名を取得しています…';
    const rows=[];const seen=new Set();
    for(const slot of slotOrder){
      if(seen.has(slot))continue;
      let it=set.items?.[slot];if(!it&&slot==='Hand')it=set.items?.Hands;if(!it)continue;
      if(slot==='Hand'&&set.items?.Hands)seen.add('Hands');
      const id=itemId(it);if(!id)continue;
      const info=await itemName(id),materia=await materiaText(it.materia||it.melds);
      rows.push(`<div class="gear-piece"><span class="gear-slot">${slotNames[slot]}</span><div><strong>${esc(info.name)}</strong>${info.ilvl?`<small>IL ${esc(info.ilvl)}</small>`:''}<span>${esc(materia)}</span></div></div>`);
    }
    const fid=foodId(set);let food='';
    if(fid){const f=await itemName(fid);food=`<div class="gear-piece gear-food"><span class="gear-slot">食事</span><div><strong>${esc(f.name)}</strong>${f.ilvl?`<small>IL ${esc(f.ilvl)}</small>`:''}</div></div>`}
    const modeLabel=mode==='ultimate'?`${selectedContent}専用BiS`:(selectedContent?'現行パッチ最新装備':(stageEl.value==='prog'?'攻略開始':'最終装備'));
    const badge=mode==='ultimate'&&activeMeta.sync?`IL${activeMeta.sync}シンク`:`パッチ${activeMeta.patch}`;
    resultEl.innerHTML=`<div class="gear-result-head"><div><small>${esc(modeLabel)}</small><h3>${esc(localizeSetName(set.name))}</h3></div><span>${esc(badge)}</span></div><div class="gear-piece-grid">${rows.join('')}${food}</div>`;
    const meta=jobMeta(jobEl.value);
    statusEl.innerHTML=`<strong>${esc(meta[2])}</strong> / ${esc(localizeSetName(set.name))} <small>（${esc(activeMeta.source)}）</small>`;
  }

  roleEl.onchange=()=>{fillJobs();fillStages(jobEl.value);load()};
  jobEl.onchange=()=>{fillStages(jobEl.value);load()};
  stageEl.onchange=load;
  setEl.onchange=renderSet;
  fillRoles();roleEl.value='tank';fillJobs();jobEl.value='war';fillStages(jobEl.value);load();
})();
