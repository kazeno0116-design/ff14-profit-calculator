(()=>{
'use strict';
function revealResult(el){if(el)el.classList.remove('is-empty')}


(()=>{'use strict';
const A={
 contentAction2:{n:'コンテンツアクション2',lv:1,cp:0,d:0,nostep:true,w:2},
 basicSynthesis:{n:'作業',lv:1,cp:0,d:10,p:120,w:3},basicTouch:{n:'加工',lv:5,cp:18,d:10,q:100,iq:1,w:3},mastersMend:{n:'マスターズメンド',lv:7,cp:88,d:0,e:'mend30',w:3},rapidSynthesis:{n:'突貫作業',lv:9,cp:0,d:10,p:500,rate:50,w:3},observe:{n:'経過観察',lv:13,cp:7,d:0,w:2},wasteNot:{n:'倹約',lv:15,cp:56,d:0,e:'wn4',w:2},veneration:{n:'ヴェネレーション',lv:15,cp:18,d:0,e:'ven4',w:2},standardTouch:{n:'中級加工',lv:18,cp:32,d:10,q:125,iq:1,w:3},greatStrides:{n:'グレートストライド',lv:21,cp:32,d:0,e:'gs3',w:2},innovation:{n:'イノベーション',lv:26,cp:18,d:0,e:'inn4',w:2},finalAppraisal:{n:'最終確認',lv:42,cp:1,d:0,e:'fa5',nostep:true,w:2},wasteNot2:{n:'長期倹約',lv:47,cp:98,d:0,e:'wn8',w:2},byregot:{n:'ビエルゴの祝福',lv:50,cp:24,d:10,q:100,finish:true,w:3},muscleMemory:{n:'確信',lv:54,cp:6,d:10,p:300,e:'mm5',first:true,w:3},prudentTouch:{n:'倹約加工',lv:66,cp:25,d:5,q:100,iq:1,noWN:true,w:3},advancedTouch:{n:'上級加工',lv:68,cp:46,d:10,q:150,iq:1,w:3},reflect:{n:'真価',lv:69,cp:6,d:10,q:300,iq:2,first:true,w:3},groundwork:{n:'下地作業',lv:72,cp:18,d:20,p:360,w:3},preparatoryTouch:{n:'下地加工',lv:71,cp:40,d:20,q:200,iq:2,w:3},prudentSynthesis:{n:'倹約作業',lv:88,cp:18,d:5,p:180,noWN:true,w:3},carefulSynthesis:{n:'模範作業',lv:62,cp:7,d:10,p:180,w:3},manipulation:{n:'マニピュレーション',lv:65,cp:96,d:0,e:'man8',w:2},delicateSynthesis:{n:'精密作業',lv:76,cp:32,d:10,p:150,q:100,iq:1,w:3},trainedEye:{n:'匠の早業',lv:80,cp:250,d:10,e:'eye',first:true,w:3},trainedFinesse:{n:'匠の神業',lv:90,cp:32,d:0,q:100,needIQ10:true,w:3},refinedTouch:{n:'洗練加工',lv:92,cp:24,d:10,q:100,iq:1,w:3},perfectMend:{n:'パーフェクトメンド',lv:98,cp:112,d:0,e:'fullmend',w:3},trainedPerfection:{n:'匠の絶技',lv:100,cp:0,d:0,e:'perfect',once:true,w:2}
};
// 匠の絶技は実機で次アクションを安定して実行するため3秒待機する。
A.trainedPerfection.w=3;
const LEVEL_TABLE={51:120,52:125,53:130,54:133,55:136,56:139,57:142,58:145,59:148,60:150,61:260,62:265,63:270,64:273,65:276,66:279,67:282,68:285,69:288,70:290,71:390,72:395,73:400,74:403,75:406,76:409,77:412,78:415,79:418,80:420,81:517,82:520,83:525,84:530,85:535,86:540,87:545,88:550,89:555,90:560,91:650,92:653,93:656,94:660,95:665,96:670,97:675,98:680,99:685,100:690};
const PROFILES={
  50:{label:'Lv50以下',recipeLv:50,rlvl:50,pd:50,pm:100,qd:30,qm:100},
  60:{label:'Lv60',recipeLv:60,rlvl:150,pd:70,pm:100,qd:50,qm:100},
  70:{label:'Lv70',recipeLv:70,rlvl:290,pd:90,pm:100,qd:70,qm:100},
  80:{label:'Lv80',recipeLv:80,rlvl:420,pd:110,pm:100,qd:90,qm:100},
  90:{label:'Lv90',recipeLv:90,rlvl:560,pd:130,pm:90,qd:115,qm:80},
  100:{label:'Lv100（星なし）',recipeLv:100,rlvl:690,pd:170,pm:90,qd:150,qm:75},
  '100s1':{label:'Lv100 ★1',recipeLv:100,rlvl:700,pd:170,pm:90,qd:150,qm:75},
  '100s2':{label:'Lv100 ★2',recipeLv:100,rlvl:710,pd:170,pm:90,qd:150,qm:75},
  '100s3':{label:'Lv100 ★3',recipeLv:100,rlvl:740,pd:170,pm:90,qd:150,qm:75},
  '100s4':{label:'Lv100 ★4',recipeLv:100,rlvl:770,pd:170,pm:90,qd:150,qm:75},
  '100s5':{label:'Lv100 ★5',recipeLv:100,rlvl:776,pd:180,pm:100,qd:180,qm:100,expert:true},
  '100expert':{label:'Lv100 高難度',recipeLv:100,rlvl:776,pd:180,pm:100,qd:180,qm:100,expert:true}
};
const $=id=>document.getElementById(id),num=id=>Math.max(0,Number($(id).value)||0),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function fresh(s){const miracle=s.cosmicAction==='miracle';return{p:0,q:s.initial,d:s.dur,cp:s.cp,iq:0,step:0,last:'',done:false,failed:false,usedPerfect:false,usedCosmic:miracle,b:{ven:0,inn:0,gs:0,man:0,wn:0,mm:0,fa:0,steady:0,perfect:false},log:miracle?['contentAction2']:[]}}
function bases(s){const apply=s.effectiveLevel<=s.rlvl;const rawP=s.craft*10/s.pd+2,rawQ=s.control*10/s.qd+35;return{p:Math.floor(apply?Math.fround(rawP*s.pm*Math.fround(.01)):rawP),q:Math.floor(apply?Math.fround(rawQ*s.qm*Math.fround(.01)):rawQ)}}
function act(st,id,s){const a=A[id],x={...st,b:{...st.b},log:st.log.concat(id)};if(!a||x.done||x.failed||s.lv<a.lv)return null;if(id==='contentAction2'&&(s.cosmicAction!=='steady'||x.usedCosmic))return null;if(id==='rapidSynthesis'&&s.safeOnly&&x.b.steady<=0)return null;if(a.first&&x.step!==0||a.needIQ10&&x.iq!==10||a.once&&x.usedPerfect||a.noWN&&x.b.wn>0)return null;
let cost=a.cp;if(id==='standardTouch'&&x.last==='basicTouch')cost=18;if(id==='advancedTouch'&&(x.last==='standardTouch'||x.last==='observe'))cost=18;if(x.cp<cost)return null;x.cp-=cost;
let dc=a.d;if(x.b.perfect&&dc>0){dc=0;x.b.perfect=false}else if(x.b.wn>0&&dc>0)dc=Math.ceil(dc/2);if(a.d>0&&x.d<=0)return null;const durabilityBefore=x.d;x.d-=dc;
const base=bases(s),oldIQ=x.iq;if(a.p){let eff=a.p;if(id==='groundwork'&&durabilityBefore<dc)eff=180;let bonus=1+(x.b.ven?0.5:0)+(x.b.mm?1:0);x.p+=Math.floor(base.p*eff/100*bonus);if(x.b.mm)x.b.mm=0}
if(a.q){let eff=a.finish?100+20*x.iq:a.q;let iqMult=1+oldIQ*.1,bonus=1+(x.b.inn?0.5:0)+(x.b.gs?1:0);x.q=Math.min(s.target, x.q+Math.floor(base.q*iqMult*eff/100*bonus));if(a.finish)x.iq=0;else{x.iq=clamp(x.iq+(a.iq||0)+(id==='refinedTouch'&&x.last==='basicTouch'?1:0),0,10)}if(x.b.gs)x.b.gs=0}
if(a.e==='mend30')x.d=Math.min(s.dur,x.d+30);if(a.e==='fullmend')x.d=s.dur;if(a.e==='eye')x.q=s.target;if(a.e==='perfect'){x.b.perfect=true;x.usedPerfect=true}if(id==='contentAction2'){x.b.steady=3;x.usedCosmic=true}
if(x.p>=s.diff){if(x.b.fa){x.p=s.diff-1;x.b.fa=0}else{x.done=true;x.p=s.diff}}
if(!x.done&&x.d<=0){x.failed=true;return null}
if(!a.nostep){const heal=x.b.man>0;for(const k of ['ven','inn','gs','man','wn','mm','fa','steady'])if(x.b[k]>0)x.b[k]--;if(heal)x.d=Math.min(s.dur,x.d+5);x.step++}
if(a.e==='wn4')x.b.wn=4;if(a.e==='wn8')x.b.wn=8;if(a.e==='ven4')x.b.ven=4;if(a.e==='inn4')x.b.inn=4;if(a.e==='gs3')x.b.gs=3;if(a.e==='man8')x.b.man=8;if(a.e==='mm5')x.b.mm=5;if(a.e==='fa5')x.b.fa=5;x.last=id;return x}
function isGoal(x,s){return!!(x&&x.done&&x.q>=s.target&&x.d>=0)}
function score(x,s){const qp=x.q/s.target,pp=x.p/s.diff;return(x.done&&x.q>=s.target?1e9:0)+qp*2e6+pp*7e5+x.cp*20+x.d*10-x.log.length*80}
function key(x){return[x.p,x.q,x.d,x.cp,x.iq,x.last,x.usedCosmic?1:0,x.b.ven,x.b.inn,x.b.gs,x.b.man,x.b.wn,x.b.mm,x.b.fa,x.b.steady,x.b.perfect?1:0].join('|')}
function candidates(x,s){let z=['basicSynthesis','basicTouch','mastersMend','wasteNot','veneration','standardTouch','greatStrides','innovation','wasteNot2','byregot','muscleMemory','prudentTouch','advancedTouch','reflect','groundwork','preparatoryTouch','prudentSynthesis','carefulSynthesis','manipulation','delicateSynthesis','trainedFinesse','refinedTouch','perfectMend','trainedPerfection'];if(s.cosmicAction==='steady'&&!x.usedCosmic)z.unshift('contentAction2');if(x.b.steady>0||!s.safeOnly)z.push('rapidSynthesis');if(x.step===0&&s.eye)z.unshift('trainedEye');z=z.filter(id=>id==='contentAction2'||s.enabledSkills.has(id));if(x.iq<1)z=z.filter(v=>v!=='byregot');if(x.q>=s.target)z=z.filter(v=>!A[v].q);if(x.p>=s.diff*.82)z.push('finalAppraisal');return z}
let lastSearchReport=null;
async function search(s,opts={}){const beamWidth=opts.beamWidth??850,timeLimit=opts.timeLimit??5000,maxDepth=opts.maxDepth??30-(s.cosmicAction==='none'?0:1),started=performance.now();let beam=[fresh(s)],best=null,maxP=0,maxQ=s.initial,bestPartial=fresh(s),completedBest=null,depthReached=0,timedOut=false;for(let depth=0;depth<maxDepth;depth++){depthReached=depth+1;const next=[],seen=new Map;for(const x of beam){for(const id of candidates(x,s)){const y=act(x,id,s);if(!y)continue;if(y.p>maxP)maxP=y.p;if(y.q>maxQ)maxQ=y.q;if(!bestPartial||score(y,s)>score(bestPartial,s))bestPartial=y;if(y.done&&(!completedBest||y.q>completedBest.q||(y.q===completedBest.q&&y.cp>completedBest.cp)))completedBest=y;if(isGoal(y,s)){if(!best||y.log.length<best.log.length||score(y,s)>score(best,s))best=y;continue}const k=key(y),old=seen.get(k);if(!old||score(y,s)>score(old,s))seen.set(k,y)}if(performance.now()-started>timeLimit){timedOut=true;break}}if(best){lastSearchReport={timedOut:false,depthReached,maxP,maxQ,bestPartial,completedBest};return best}if(timedOut)break;next.push(...seen.values());next.sort((a,b)=>score(b,s)-score(a,s));beam=next.slice(0,beamWidth);if(!beam.length)break;if(depth%2===1)await new Promise(r=>setTimeout(r,0))}lastSearchReport={timedOut,depthReached,maxP,maxQ,bestPartial,completedBest};return best}
function simulate(ids,s){let x=fresh(s),start=x.log.length&&ids[0]==='contentAction2'?1:0;for(let i=start;i<ids.length;i++){x=act(x,ids[i],s);if(!x)return null}return x}
function prune(ids,s){let out=ids.slice(),first=out[0]==='contentAction2'?1:0;for(let i=out.length-1;i>=first;i--){const t=out.slice(0,i).concat(out.slice(i+1)),x=simulate(t,s);if(isGoal(x,s))out=t}return out}
function buffCoverage(ids,s){let x=fresh(s),ven=0,start=x.log.length&&ids[0]==='contentAction2'?1:0;for(let i=start;i<ids.length;i++){const id=ids[i],a=A[id];if(a&&a.p&&x.b.ven>0)ven+=id==='groundwork'&&x.d<20?180:a.p;x=act(x,id,s);if(!x)return null}return ven}
function normalizeBuffOrder(ids,s){let out=ids.slice(),changed=true;while(changed){changed=false;for(let i=1;i<out.length;i++){if(out[i]!=='veneration'||!A[out[i-1]]?.p)continue;const t=out.slice();[t[i-1],t[i]]=[t[i],t[i-1]];const before=simulate(out,s),after=simulate(t,s);if(!before||!after||!after.done||after.q<s.target||after.cp<before.cp||after.d<before.d)continue;if(buffCoverage(t,s)>buffCoverage(out,s)){out=t;changed=true;break}}}return out}
function format(ids){const lines=ids.map(id=>`/ac "${A[id].n}" <wait.${A[id].w}>`),parts=[];while(lines.length){const room=lines.length>15?14:15,p=lines.splice(0,room);if(lines.length)p.push(`/echo 次のマクロへ <se.1>`);parts.push(p.join('\n'))}return parts}
function getStats(){const profile=PROFILES[$('recipeLevel').value]||PROFILES[100];const lv=num('crafterLevel'),includeInitial=$('initialQualityToggle').getAttribute('aria-pressed')==='true',cosmicAction=profile.cosmic?getSelectedCosmicAction():'none';return{...profile,effectiveLevel:LEVEL_TABLE[lv]||lv,lv,craft:num('craftsmanship'),control:num('control'),cp:num('cp'),dur:num('durability'),diff:num('difficulty'),target:num('maxQuality'),initial:includeInitial?num('initialQuality'):0,eye:$('useTrainedEye').checked&&!profile.expert&&lv>=profile.recipeLv+10&&enabledSkills.has('trainedEye'),safeOnly:$('safeOnly').checked,cosmicAction,enabledSkills:new Set(enabledSkills)}}
let parts=[];function validate(s){if(!s.craft||!s.control||!s.cp||!s.dur||!s.diff||!s.target)return'全ステータス、耐久、工数、目標品質を入力してください。';if(s.initial>s.target)return'初期品質は目標品質以下にしてください。';return''}
function minValueForRoute(ids,s,key,low,high){
 let lo=Math.max(0,Math.floor(low)),hi=Math.max(lo,Math.ceil(high));
 const works=v=>{const t={...s,[key]:v,enabledSkills:new Set(s.enabledSkills)},x=simulate(ids,t);return isGoal(x,t)};
 if(!works(hi))return null;
 while(lo<hi){const mid=Math.floor((lo+hi)/2);if(works(mid))hi=mid;else lo=mid+1}return lo
}
async function relaxedRequirement(s,key,high){
 const t={...s,[key]:high,enabledSkills:new Set(s.enabledSkills)};
 const x=await search(t,{beamWidth:320,timeLimit:900,maxDepth:30-(s.cosmicAction==='none'?0:1)});
 if(!x)return null;
 const min=minValueForRoute(x.log,s,key,s[key],high);
 return min==null?null:{required:min,shortage:Math.max(0,min-s[key]),actions:x.log.length}
}
async function findRequirement(s,key,steps){
 // 「比例換算」ではなく、実際に成立する数値だけを採用する。
 // 各試行は短時間に制限し、診断全体が長時間化しないようにする。
 const base=s[key];
 let fail=base,pass=null,route=null;
 for(const v of steps){
   if(v<=base)continue;
   const t={...s,[key]:v,enabledSkills:new Set(s.enabledSkills)};
   const x=await search(t,{beamWidth:420,timeLimit:650,maxDepth:30-(s.cosmicAction==='none'?0:1)});
   if(x){pass=v;route=x;break}
   fail=v;
 }
 if(pass==null)return null;
 // 成立区間内を二分探索。探索がヒューリスティックなので「確認できた最低値」として扱う。
 let lo=Math.max(base+1,fail+1),hi=pass,bestRoute=route;
 for(let i=0;i<7&&lo<hi;i++){
   const mid=Math.floor((lo+hi)/2);
   const t={...s,[key]:mid,enabledSkills:new Set(s.enabledSkills)};
   const x=await search(t,{beamWidth:460,timeLimit:700,maxDepth:30-(s.cosmicAction==='none'?0:1)});
   if(x){hi=mid;bestRoute=x}else lo=mid+1;
 }
 // 最終値をもう一度確認する。
 const finalStats={...s,[key]:hi,enabledSkills:new Set(s.enabledSkills)};
 const finalRoute=await search(finalStats,{beamWidth:520,timeLimit:850,maxDepth:30-(s.cosmicAction==='none'?0:1)});
 if(!finalRoute)return{required:pass,shortage:pass-base,verified:true,actions:bestRoute?.log.length||route?.log.length||0};
 return{required:hi,shortage:hi-base,verified:true,actions:finalRoute.log.length};
}
async function findCombinedRequirement(s){
 // 単独改善で成立しない場合のみ、現実的な複合改善パターンを確認する。
 const patterns=[
   {craft:250,control:250,cp:50},{craft:500,control:500,cp:50},
   {craft:500,control:750,cp:100},{craft:750,control:750,cp:100},
   {craft:1000,control:1000,cp:150},{craft:1500,control:1500,cp:200}
 ];
 for(const d of patterns){
   const t={...s,craft:s.craft+d.craft,control:s.control+d.control,cp:s.cp+d.cp,enabledSkills:new Set(s.enabledSkills)};
   const x=await search(t,{beamWidth:450,timeLimit:750,maxDepth:30-(s.cosmicAction==='none'?0:1)});
   if(x)return{...d,requiredCraft:t.craft,requiredControl:t.control,requiredCp:t.cp,actions:x.log.length};
 }
 return null;
}
async function diagnoseFailure(s,report){
 const notes=[],r=report||{},recommend=[];
 const pReach=Math.floor(r.maxP||0),bestCompletedQ=Math.floor((r.completedBest&&r.completedBest.q)||0),qReach=Math.floor(r.maxQ||0);
 if(r.completedBest&&bestCompletedQ<s.target){
   notes.push(`<strong>品質不足：</strong>完成できた候補の最高品質は ${bestCompletedQ}/${s.target}（品質 ${s.target-bestCompletedQ} 不足）です。`);
 }else if(pReach<s.diff){
   notes.push(`<strong>工数不足：</strong>探索中の最大工数は ${pReach}/${s.diff}（工数 ${s.diff-pReach} 不足）です。`);
 }else if(qReach<s.target){
   notes.push(`<strong>品質不足：</strong>探索中の最大品質は ${qReach}/${s.target}（品質 ${s.target-qReach} 不足）です。`);
 }else{
   notes.push('<strong>工数・品質の単純な到達差だけでは原因を確定できません。</strong> CP・耐久・30アクション上限・スキル構成を含めて成立条件を確認します。');
 }

 // 現実的な範囲だけで「その数値で実際にマクロが成立した」条件を探す。
 const cpSteps=[s.cp+25,s.cp+50,s.cp+75,s.cp+100,s.cp+150,s.cp+200,s.cp+300,s.cp+450];
 const craftSteps=[s.craft+100,s.craft+250,s.craft+500,s.craft+750,s.craft+1000,s.craft+1500,s.craft+2200,s.craft+3000];
 const controlSteps=[s.control+100,s.control+250,s.control+500,s.control+750,s.control+1000,s.control+1500,s.control+2200,s.control+3000];

 // 主症状に近い項目から調査し、無駄な探索を減らす。
 let craftReq=null,controlReq=null,cpReq=null;
 if(pReach<s.diff)craftReq=await findRequirement(s,'craft',craftSteps);
 if((bestCompletedQ&&bestCompletedQ<s.target)||qReach<s.target)controlReq=await findRequirement(s,'control',controlSteps);
 cpReq=await findRequirement(s,'cp',cpSteps);
 // 上で未調査だったものも、原因が複合の可能性があるため短く確認。
 if(!craftReq&&pReach>=s.diff)craftReq=await findRequirement(s,'craft',craftSteps.slice(0,6));
 if(!controlReq&&bestCompletedQ>=s.target&&qReach>=s.target)controlReq=await findRequirement(s,'control',controlSteps.slice(0,6));

 if(craftReq)recommend.push(`<strong>作業精度 ${craftReq.required} 以上</strong>（現在 ${s.craft} / <strong>+${craftReq.shortage}</strong>）で成立を確認`);
 if(controlReq)recommend.push(`<strong>加工精度 ${controlReq.required} 以上</strong>（現在 ${s.control} / <strong>+${controlReq.shortage}</strong>）で成立を確認`);
 if(cpReq)recommend.push(`<strong>CP ${cpReq.required} 以上</strong>（現在 ${s.cp} / <strong>+${cpReq.shortage}</strong>）で成立を確認`);

 if(recommend.length){
   recommend.sort((a,b)=>{const na=+(a.match(/\+(\d+)/)||[0,999999])[1],nb=+(b.match(/\+(\d+)/)||[0,999999])[1];return na-nb});
   notes.push(`<strong>単独で改善する場合の成立目安：</strong><br>${recommend.map((v,i)=>`${i+1}. ${v}`).join('<br>')}<br><span class="skill-note">ここに表示するのは、実際に再探索して目標工数・目標品質の両方を満たすマクロが見つかった数値だけです。単純比例で算出した推定値は表示しません。</span>`);
 }else{
   const combo=await findCombinedRequirement(s);
   if(combo){
     notes.push(`<strong>複数ステータスの同時改善が必要な可能性が高いです。</strong><br>成立を確認できた例：<br>・作業精度 ${combo.requiredCraft}（+${combo.craft}）<br>・加工精度 ${combo.requiredControl}（+${combo.control}）<br>・CP ${combo.requiredCp}（+${combo.cp}）<br><span class="skill-note">この組み合わせは最小値の保証ではありませんが、実際にマクロ成立を確認した具体例です。</span>`);
   }else{
     notes.push('<strong>ステータス単独の不足量は確定できませんでした。</strong><br>作業精度 +3000、加工精度 +3000、CP +450 まで単独改善を試しても、この短時間探索では成立を確認できませんでした。スキル設定・耐久・30アクション上限、または複数ステータスの組み合わせが主因の可能性があります。');
   }
 }

 const disabled=Object.keys(A).filter(id=>id!=='contentAction2'&&A[id].lv<=s.lv&&!s.enabledSkills.has(id));
 if(disabled.length){
   const all={...s,enabledSkills:new Set(Object.keys(A).filter(id=>id!=='contentAction2'&&A[id].lv<=s.lv))};
   const x=await search(all,{beamWidth:300,timeLimit:650});
   if(x)notes.push(`<strong>スキル設定：</strong>現在無効のスキルを有効にすると、現在ステータスのままで成立するマクロを確認しました。無効中：${disabled.slice(0,8).map(id=>A[id].n).join('、')}${disabled.length>8?' ほか':''}`)
 }
 if(r.timedOut)notes.push('<span class="skill-note">通常探索は時間上限で打ち切られました。診断値は別の短時間再探索で成立確認したものです。</span>');
 return `<div class="diagnosis"><strong>条件を満たすマクロを生成できませんでした。</strong><br>${notes.join('<br>')}</div>`
}
function resetRun(b){b.disabled=false;b.classList.remove('loading','success');b.textContent='マクロ生成'}
async function run(){const b=$('run'),r=$('result'),sum=$('summary');r.classList.remove('is-empty');b.disabled=true;b.classList.remove('success');b.classList.add('loading');b.setAttribute('aria-label','loading...');b.innerHTML='生成中<span class="loading-dot">.</span><span class="loading-dot">.</span><span class="loading-dot">.</span>';r.textContent='候補を探索しています…';sum.innerHTML='';$('copies').innerHTML='';const s=getStats(),err=validate(s);if(err){r.innerHTML=`<span class="error">ERROR: ${err}</span>`;b.removeAttribute('aria-label');resetRun(b);return}await new Promise(q=>setTimeout(q,0));let x=await search(s);const primaryReport=lastSearchReport;if(!x){r.textContent='生成できませんでした。原因を高速診断しています…';r.innerHTML=await diagnoseFailure(s,primaryReport);b.removeAttribute('aria-label');resetRun(b);return}const optimized=normalizeBuffOrder(prune(x.log,s),s);x=simulate(optimized,s);if(!isGoal(x,s)||x.p<s.diff){r.innerHTML='<span class="error">最終再検証で未完成または耐久不足を検出したため、マクロ出力を中止しました。</span>';b.removeAttribute('aria-label');resetRun(b);return}parts=format(x.log);const seconds=x.log.reduce((n,id)=>n+A[id].w,0),base=bases(s),actionLabel=s.cosmicAction==='steady'?'専用ステディハンド':s.cosmicAction==='miracle'?'ミラクルマテリアル':'なし',miracle=s.cosmicAction==='miracle'?'<br><span class="error">ミラクルマテリアルのランダムな有利状態は保証値へ加算していません。</span>':'',warning=s.expert?'<br><span class="error">高難度レシピは状態変化を再現しない通常状態での参考計算です。</span>':'';sum.innerHTML=`<div class="summary">${s.label}<br>専用アクション: ${actionLabel}<br>${x.log.length}アクション / ${parts.length}マクロ / 約${seconds}秒　到達: 工数 ${x.p}/${s.diff}・品質 ${x.q}/${s.target}・残CP ${x.cp}・残耐久 ${x.d}<br>検算値: 基礎工数 ${base.p}・基礎品質 ${base.q}${miracle}${warning}</div>`;r.textContent=parts.map((p,i)=>`--- MACRO ${i+1} ---\n${p}`).join('\n\n');$('copies').innerHTML=parts.map((_,i)=>`<button class="copy" data-i="${i}">COPY MACRO ${i+1}</button>`).join('');b.disabled=false;b.removeAttribute('aria-label');b.classList.remove('loading');b.classList.add('success');b.textContent='生成完了'}
async function copy(text,btn){try{await navigator.clipboard.writeText(text)}catch(_){const t=document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();document.execCommand('copy');t.remove()}const old=btn.textContent;btn.textContent='COMPLETED';btn.classList.add('ok');setTimeout(()=>{btn.textContent=old;btn.classList.remove('ok')},1500)}
function ripple(e){const b=e.target.closest('.run,.copy');if(!b)return;const rect=b.getBoundingClientRect(),dot=document.createElement('span');dot.className='ripple';dot.style.left=`${e.clientX-rect.left}px`;dot.style.top=`${e.clientY-rect.top}px`;b.appendChild(dot);setTimeout(()=>dot.remove(),650)}
function syncInitialQuality(){if(!$('initialQuality').dataset.edited)$('initialQuality').value=Math.floor(num('maxQuality')*.5)}
function setInitialToggle(on){
 const b=$('initialQualityToggle');
 b.setAttribute('aria-pressed',String(on));
 b.setAttribute('aria-checked',String(on));
 b.classList.toggle('off',!on);
 const text=b.querySelector('.quality-switch-text');
 if(text)text.textContent=on?'含める':'含めない';
 $('initialQuality').style.opacity=on?'1':'.55';
}
function toggleInitial(){const on=$('initialQualityToggle').getAttribute('aria-pressed')!=='true';setInitialToggle(on)}


const SKILL_STORAGE_KEY='ff14CrafterMacroGenerator.skills.v1';
let selectedCosmicAction='none';
const COSMIC_SKILLS=[{id:'miracle',name:'ミラクルマテリアル'},{id:'steady',name:'コスモステディハンド'}];
let enabledSkills=new Set(Object.keys(A).filter(id=>id!=='contentAction2'));
function skillCategory(a){return a.p&&a.q?'作業・加工':a.p?'作業':a.q?'加工':'補助'}
function renderSkills(){
 const normal=$('normalSkillList');
 normal.innerHTML=Object.entries(A)
   .filter(([id])=>id!=='contentAction2')
   .sort((a,b)=>a[1].lv-b[1].lv)
   .map(([id,a])=>`<label class="skill-chip"><input class="skill-check" type="checkbox" data-skill="${id}" ${enabledSkills.has(id)?'checked':''}><span class="skill-level">Lv${a.lv}</span><span class="skill-name">${a.n}</span><span class="skill-kind">${skillCategory(a)}</span></label>`)
   .join('');
 const cosmic=$('cosmicSkillList');
 if(cosmic){
   cosmic.innerHTML=COSMIC_SKILLS.map(x=>`<label class="skill-chip cosmic-skill-chip"><input class="cosmic-skill-check" type="checkbox" data-cosmic="${x.id}" ${selectedCosmicAction===x.id?'checked':''}><span>${x.name}</span></label>`).join('');
 }
}
function saveSkillSettings(){try{localStorage.setItem(SKILL_STORAGE_KEY,JSON.stringify({enabled:[...enabledSkills],cosmic:selectedCosmicAction}))}catch(_){}}
function restoreSkillSettings(){try{
 const raw=localStorage.getItem(SKILL_STORAGE_KEY);if(!raw)return;
 const d=JSON.parse(raw);
 if(Array.isArray(d.enabled))enabledSkills=new Set(d.enabled.filter(id=>A[id]&&id!=='contentAction2'));
 if(COSMIC_SKILLS.some(x=>x.id===d.cosmic))selectedCosmicAction=d.cosmic;
}catch(_){}}
function getSelectedCosmicAction(){return selectedCosmicAction}
function setSkillsByLevel(level){enabledSkills=new Set(Object.entries(A).filter(([id,a])=>id!=='contentAction2'&&a.lv<=level).map(([id])=>id));renderSkills();saveSkillSettings()}
const STATUS_STORAGE_KEY='ff14CrafterMacroGenerator.playerStatus.v2',STATUS_FIELDS=['craftsmanship','control','cp'];
function savePlayerStatus(){try{const data={};for(const id of STATUS_FIELDS)data[id]=$(id).value;localStorage.setItem(STATUS_STORAGE_KEY,JSON.stringify(data))}catch(_){}}
function restorePlayerStatus(){try{const raw=localStorage.getItem(STATUS_STORAGE_KEY);if(!raw)return;const data=JSON.parse(raw);for(const id of STATUS_FIELDS){if(data&&Object.prototype.hasOwnProperty.call(data,id)&&data[id]!==null&&data[id]!==undefined)$(id).value=String(data[id])}}catch(_){}}
function enableReplaceOnFocus(){for(const input of document.querySelectorAll('input[type=\"number\"]')){input.addEventListener('focus',()=>input.select());input.addEventListener('pointerup',e=>{e.preventDefault();input.select()})}}
$('run').addEventListener('click',run);$('run').addEventListener('pointerleave',()=>{const b=$('run');if(b.classList.contains('success'))resetRun(b)});document.addEventListener('pointerdown',ripple);$('copies').addEventListener('click',e=>{const b=e.target.closest('[data-i]');if(b)copy(parts[+b.dataset.i],b)});$('initialQualityToggle').addEventListener('click',toggleInitial);$('maxQuality').addEventListener('input',syncInitialQuality);$('initialQuality').addEventListener('input',()=>{$('initialQuality').dataset.edited='1'});$('selectAllSkills').addEventListener('click',()=>{enabledSkills=new Set(Object.keys(A).filter(id=>id!=='contentAction2'));renderSkills();saveSkillSettings()});$('clearAllSkills').addEventListener('click',()=>{enabledSkills.clear();renderSkills();saveSkillSettings()});$('selectByLevel').addEventListener('click',()=>setSkillsByLevel(Math.max(1,Math.min(100,num('skillLevelLimit')))));$('selectCurrentLevel').addEventListener('click',()=>setSkillsByLevel(Math.max(1,Math.min(100,num('crafterLevel')))));$('normalSkillList').addEventListener('change',e=>{const c=e.target.closest('[data-skill]');if(!c)return;c.checked?enabledSkills.add(c.dataset.skill):enabledSkills.delete(c.dataset.skill);saveSkillSettings()});$('cosmicSkillList').addEventListener('change',e=>{
 const c=e.target.closest('[data-cosmic]');if(!c)return;
 selectedCosmicAction=c.checked?c.dataset.cosmic:'none';
 renderSkills();
 saveSkillSettings();
});restorePlayerStatus();restoreSkillSettings();renderSkills();enableReplaceOnFocus();for(const id of STATUS_FIELDS)$(id).addEventListener('input',savePlayerStatus);syncInitialQuality()
})();

})();
function initMacroTabs(){const byId=id=>document.getElementById(id),g=byId('generatorPanel'),sk=byId('skillsPanel'),tg=byId('macroGeneratorTab'),ts=byId('macroSkillsTab'),wrap=byId('macroGeneratorInline');if(!g||!sk||!tg||!ts||!wrap)return;wrap.classList.add('macro-tabs-ready');const activate=name=>{const gen=name==='generator';g.hidden=!gen;sk.hidden=gen;tg.classList.toggle('is-active',gen);ts.classList.toggle('is-active',!gen);tg.setAttribute('aria-selected',String(gen));ts.setAttribute('aria-selected',String(!gen));};tg.addEventListener('click',()=>activate('generator'));ts.addEventListener('click',()=>activate('skills'));activate('generator');}
initMacroTabs();
