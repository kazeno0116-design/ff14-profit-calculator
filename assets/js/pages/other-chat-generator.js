(()=>{
'use strict';
function revealResult(el){if(el)el.classList.remove('is-empty')}

const ids=['chatType','chatTone','chatContent','chatGoal','chatTank','chatHealer','chatMelee','chatRanged','chatCaster','chatProgress','chatNote'];

function get(id){return document.getElementById(id)}
function val(id){return (get(id)?.value||'').trim()}
function label(id){
  const el=get(id);
  if(!el)return '';
  if(el.tagName==='SELECT') return el.options[el.selectedIndex]?.text?.trim()||'';
  return el.value.trim();
}

const typeRules={
  content:{lead:(content)=>content?`${content}の募集です。`:'コンテンツ参加者を募集します。'},
  farm:{lead:(content)=>content?`${content}を周回します。`:'周回メンバーを募集します。'},
  first:{lead:(content)=>content?`${content}の練習募集です。`:'練習募集です。'},
  high:{lead:(content)=>content?`${content}の攻略メンバーを募集します。`:'高難度コンテンツの攻略メンバーを募集します。'},
  map:{lead:(content)=>content?`${content}に行くメンバーを募集します。`:'地図・特殊コンテンツの参加者を募集します。'},
  free:{lead:(content)=>content?`${content}の募集です。`:'参加者を募集します。'}
};

const goalOptions={
  content:[
    ['', '指定なし'],['クリア目的','クリア目的'],['練習','練習'],['周回','周回'],
    ['初見歓迎','初見歓迎'],['お手伝い歓迎','お手伝い歓迎']
  ],
  farm:[
    ['', '指定なし'],['高速周回','高速周回'],['のんびり周回','のんびり周回'],
    ['特定報酬狙い','特定報酬狙い'],['お手伝い歓迎','お手伝い歓迎']
  ],
  first:[
    ['', '指定なし'],['初見歓迎','初見歓迎'],['未予習OK','未予習OK'],
    ['ギミック確認','ギミック確認'],['クリア目標','クリア目標'],['お手伝い歓迎','お手伝い歓迎']
  ],
  high:[
    ['', '指定なし'],['クリア目的','クリア目的'],['練習','練習'],['消化','消化'],
    ['周回','周回'],['初見歓迎','初見歓迎']
  ],
  map:[
    ['', '指定なし'],['地図消化','地図消化'],['ポータル突入後まで','ポータル突入後まで'],
    ['深層・特殊エリア狙い','深層・特殊エリア狙い'],['のんびり進行','のんびり進行'],
    ['初見歓迎','初見歓迎']
  ],
  free:[
    ['', '指定なし'],['クリア目的','クリア目的'],['練習','練習'],['周回','周回'],
    ['初見歓迎','初見歓迎'],['お手伝い歓迎','お手伝い歓迎']
  ]
};

const toneEnding={
  normal:'参加できる方、よろしくお願いします！',
  friendly:'気軽に参加してください～！',
  short:'参加できる方お願いします！',
  polite:'参加可能な方がいらっしゃいましたら、よろしくお願いいたします。'
};

function setGoalOptions(preserve=true){
  const select=get('chatGoal');
  if(!select)return;
  const previous=preserve?select.value:'';
  const type=val('chatType')||'content';
  const options=goalOptions[type]||goalOptions.free;
  select.innerHTML=options.map(([value,text])=>`<option value="${FF14Tools.esc(value)}">${FF14Tools.esc(text)}</option>`).join('');
  if(previous && options.some(([value])=>value===previous)) select.value=previous;
}

function naturalGoalPhrase(goalText){
  const g=goalText.trim();
  if(!g)return '';
  const replacements={
    'クリア目的':'クリアを目指します',
    'クリア目標':'クリアを目指します',
    '練習':'練習します',
    '周回':'周回します',
    '消化':'消化目的です',
    '初見歓迎':'初見の方も歓迎です',
    'お手伝い歓迎':'お手伝いの方も歓迎です',
    '高速周回':'テンポよく周回します',
    'のんびり周回':'のんびり周回します',
    '特定報酬狙い':'特定報酬狙いです',
    '未予習OK':'未予習でも大丈夫です',
    'ギミック確認':'ギミックを確認しながら進めます',
    '地図消化':'地図消化で進めます',
    'ポータル突入後まで':'ポータル突入後まで進めます',
    '深層・特殊エリア狙い':'深層・特殊エリアを狙います',
    'のんびり進行':'のんびり進行します'
  };
  return replacements[g]||(/[。！!？?]$/.test(g)?g:`${g}です`);
}

function naturalProgress(progress){
  if(!progress)return '';
  return label('chatProgress');
}

function rolePhrase(){
  const roleIds=[
    ['chatTank','タンク'],
    ['chatHealer','ヒーラー'],
    ['chatMelee','近接DPS'],
    ['chatRanged','遠隔物理DPS'],
    ['chatCaster','遠隔魔法DPS']
  ];
  const roles=roleIds
    .map(([id,name])=>[name,Number(val(id)||0)])
    .filter(([,count])=>count>0)
    .map(([name,count])=>`${name}${count}名`);
  return roles.length?`${roles.join('・')}募集です。`:'';
}

function saveChat(){
  const data={};
  ids.forEach(id=>data[id]=val(id));
  FF14Tools.save('chatRecruitGenerator',data);
}

function restoreChat(){
  const saved=FF14Tools.load('chatRecruitGenerator',null);
  setGoalOptions(false);
  if(!saved)return;
  const type=get('chatType');
  if(type && saved.chatType!=null) type.value=saved.chatType;
  setGoalOptions(false);
  ids.forEach(id=>{
    const el=get(id);
    if(el && saved[id]!=null){
      const hasOption=el.tagName!=='SELECT'||[...el.options].some(o=>o.value===String(saved[id]));
      if(hasOption) el.value=saved[id];
    }
  });
}

function buildChat(){
  const type=val('chatType')||'content';
  const tone=val('chatTone')||'normal';
  const content=val('chatContent');
  const goal=val('chatGoal');
  const progress=val('chatProgress');
  const note=val('chatNote');

  const rule=typeRules[type]||typeRules.free;
  const parts=[rule.lead(content)];

  const goalPhrase=naturalGoalPhrase(goal);
  if(goalPhrase) parts.push(/[。！!？?]$/.test(goalPhrase)?goalPhrase:`${goalPhrase}。`);

  if(progress){
    const clean=naturalProgress(progress).trim();
    if(clean){
      if(/[。！!？?]$/.test(clean)) parts.push(clean);
      else if(/解散|安定|練習|済み|から|まで|目標/.test(clean)) parts.push(`${clean}。`);
      else parts.push(`進行度：${clean}。`);
    }
  }

  const roles=rolePhrase();
  if(roles) parts.push(roles);

  if(note) parts.push(/[。！!？?]$/.test(note)?note:`${note}。`);

  parts.push(toneEnding[tone]||toneEnding.normal);

  const sentences=[];
  for(const part of parts){
    const clean=part.replace(/\s+/g,' ').replace(/。。+/g,'。').trim();
    if(clean && !sentences.includes(clean)) sentences.push(clean);
  }

  const msg=sentences.join(' ');
  revealResult(chatResult);
  chatResult.innerHTML=`<h3>生成された募集文</h3>
    <textarea id="chatOutput" class="generated-text" rows="6">${FF14Tools.esc(msg)}</textarea>
    <div class="chat-counter"><span id="chatChars">${msg.length}文字</span></div>
    <div class="tool-actions"><button class="tool-btn" id="copyChat" type="button">コピー</button></div>`;

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
  setGoalOptions(false);
  FF14Tools.save('chatRecruitGenerator',{});
  chatResult.textContent='';
  chatResult.classList.add('is-empty');
};

get('chatType')?.addEventListener('change',()=>{
  setGoalOptions(false);
  saveChat();
});

ids.forEach(id=>{
  const el=get(id);
  if(!el || id==='chatType')return;
  el.addEventListener('change',saveChat);
  if(el.tagName==='INPUT'||el.tagName==='TEXTAREA') el.addEventListener('input',saveChat);
});

restoreChat();
})();
