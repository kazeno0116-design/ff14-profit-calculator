(()=>{
'use strict';
function revealResult(el){if(el)el.classList.remove('is-empty')}


const ids=['chatType','chatTone','chatContent','chatGoal','chatCount','chatRole','chatProgress','chatNote'];

function get(id){return document.getElementById(id)}
function val(id){return (get(id)?.value||'').trim()}
function label(id){
  const el=get(id);
  if(!el)return '';
  if(el.tagName==='SELECT') return el.options[el.selectedIndex]?.text?.trim()||'';
  return el.value.trim();
}

const typeRules={
  content:{
    lead:(content)=>content ? `${content}の募集です。` : 'コンテンツ参加者を募集します。',
    defaultGoal:''
  },
  farm:{
    lead:(content)=>content ? `${content}を周回します。` : '周回メンバーを募集します。',
    defaultGoal:'周回'
  },
  first:{
    lead:(content)=>content ? `${content}の練習募集です。` : '練習募集です。',
    defaultGoal:'練習'
  },
  high:{
    lead:(content)=>content ? `${content}の攻略メンバーを募集します。` : '高難度コンテンツの攻略メンバーを募集します。',
    defaultGoal:'攻略'
  },
  map:{
    lead:(content)=>content ? `${content}に行くメンバーを募集します。` : '地図コンテンツの参加者を募集します。',
    defaultGoal:''
  },
  free:{
    lead:(content)=>content ? `${content}の募集です。` : '参加者を募集します。',
    defaultGoal:''
  }
};

const toneEnding={
  normal:'参加できる方、よろしくお願いします！',
  friendly:'気軽に参加してください～！',
  short:'参加できる方お願いします！',
  polite:'参加可能な方がいらっしゃいましたら、よろしくお願いいたします。'
};

function normalizedGoal(raw){
  return raw.replace(/\s+/g,'').toLowerCase();
}

function isDuplicateGoal(type, goalText){
  if(!goalText)return true;
  const g=normalizedGoal(goalText);
  const duplicateSets={
    farm:['周回','周回目的','周回します','周回希望','ファーム','farm'],
    first:['練習','練習目的','練習します','初見練習','練習希望'],
    high:['攻略','攻略目的','クリア目的','クリア','攻略希望'],
    map:['地図','地図周回','トレジャーハント'],
    content:[]
  };
  return (duplicateSets[type]||[]).some(x=>g===normalizedGoal(x));
}

function naturalGoalPhrase(goalText){
  const g=goalText.trim();
  if(!g)return '';
  const replacements={
    'クリア目的':'クリアを目指します',
    'クリア':'クリアを目指します',
    '周回目的':'周回します',
    '周回':'周回します',
    '練習目的':'練習します',
    '練習':'練習します',
    '初見歓迎':'初見の方も歓迎です',
    '初見練習':'初見から練習します',
    'お手伝い歓迎':'お手伝いの方も歓迎です',
    '消化':'消化目的です',
    '消化目的':'消化目的です',
    '箱目的':'報酬目的です',
    '報酬目的':'報酬目的です'
  };
  return replacements[g]||(
    /[。！!？?]$/.test(g) ? g : `${g}です`
  );
}

function naturalProgress(progress){
  if(!progress)return '';
  const map={
    'first':'初見から',
    'early':'序盤から',
    'mid':'中盤から',
    'late':'終盤から',
    'clear':'クリア済み',
    'farm':'周回経験あり'
  };
  return map[progress]||label('chatProgress');
}

function saveChat(){
  const data={};
  ids.forEach(id=>data[id]=val(id));
  FF14Tools.save('chatRecruitGenerator',data);
}

function restoreChat(){
  const saved=FF14Tools.load('chatRecruitGenerator',null);
  if(!saved)return;
  ids.forEach(id=>{
    const el=get(id);
    if(el && saved[id]!=null) el.value=saved[id];
  });
}

function buildChat(){
  const type=val('chatType')||'content';
  const tone=val('chatTone')||'normal';
  const content=val('chatContent');
  const goal=val('chatGoal');
  const count=val('chatCount');
  const role=val('chatRole');
  const progress=val('chatProgress');
  const note=val('chatNote');

  const rule=typeRules[type]||typeRules.free;
  const parts=[];

  // 1. Lead sentence – type already expresses the core intent.
  parts.push(rule.lead(content));

  // 2. Goal – omit if it duplicates the selected type.
  if(!isDuplicateGoal(type,goal)){
    const phrase=naturalGoalPhrase(goal);
    if(phrase) parts.push(/[。！!？?]$/.test(phrase)?phrase:`${phrase}。`);
  }

  // 3. Progress / experience – avoid repeating "周回" if farm already covers it.
  if(progress){
    const progText=naturalProgress(progress);
    if(!(type==='farm' && /周回/.test(progText))){
      if(progress==='clear') parts.push('クリア済みの方を想定しています。');
      else if(progress==='farm') parts.push('周回経験のある方だと助かります。');
      else {
        const clean=progText.trim();
        if(/[。！!？?]$/.test(clean)) parts.push(clean);
        else if(/解散|安定|練習|済み|から|まで|目標/.test(clean)) parts.push(`${clean}。`);
        else parts.push(`進行度：${clean}。`);
      }
    }
  }

  // 4. Party constraints
  const constraints=[];
  if(count){
    const countText=label('chatCount');
    if(countText && countText!=='指定なし') constraints.push(`${countText}募集`);
  }
  if(role){
    const r=/募集|不問|指定なし/.test(role)?role:`${role}募集`;
    if(r!=='指定なし') constraints.push(r);
  }
  if(constraints.length){
    // If count and role are identical-like free text, unique them.
    parts.push([...new Set(constraints)].join('・')+'です。');
  }

  // 5. Free note
  if(note){
    parts.push(/[。！!？?]$/.test(note)?note:`${note}。`);
  }

  // 6. Tone-aware closing
  parts.push(toneEnding[tone]||toneEnding.normal);

  // Clean up duplicated punctuation/spaces and accidental repeated sentences.
  let sentences=[];
  for(const part of parts){
    const clean=part.replace(/\s+/g,' ').replace(/。。+/g,'。').trim();
    if(!clean)continue;
    if(!sentences.some(x=>x===clean)) sentences.push(clean);
  }

  let msg=sentences.join(' ');
  msg=msg
    .replace(/周回します。\s*周回します。/g,'周回します。')
    .replace(/募集です。\s*募集です。/g,'募集です。')
    .replace(/です。\s*です。/g,'です。');

  revealResult(chatResult);chatResult.innerHTML=`<h3>生成された募集文</h3>
    <textarea id="chatOutput" class="generated-text" rows="6">${FF14Tools.esc(msg)}</textarea>
    <div class="chat-counter">
      <span id="chatChars">${msg.length}文字</span>
      
    </div>
    <div class="tool-actions">
      <button class="tool-btn" id="copyChat" type="button">コピー</button>
    </div>`;

  const out=document.getElementById('chatOutput');
  const counter=document.getElementById('chatChars');
  out.addEventListener('input',()=>counter.textContent=out.value.length+'文字');
  document.getElementById('copyChat').onclick=function(){FF14Tools.copy(out.value,this)};
  saveChat();
}

makeChat.onclick=buildChat;
clearChat.onclick=()=>{
  ids.forEach(id=>{
    const e=get(id);
    if(!e)return;
    if(e.tagName==='SELECT') e.selectedIndex=0;
    else e.value='';
  });
  FF14Tools.save('chatRecruitGenerator',{});
  chatResult.textContent='';chatResult.classList.add('is-empty');
};

ids.forEach(id=>{
  const el=get(id);
  if(!el)return;
  el.addEventListener('change',saveChat);
  if(el.tagName==='INPUT'||el.tagName==='TEXTAREA') el.addEventListener('input',saveChat);
});

restoreChat();
})();