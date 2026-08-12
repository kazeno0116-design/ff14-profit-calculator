#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),{performance}=require('perf_hooks');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/js/pages/crafter-macro.js'),'utf8');
const marker="$ ('run')"; // unused
const start=source.indexOf("(()=>{'use strict';\nconst A=");
const end=source.indexOf("$('run').addEventListener('click',run);",start);
let core=source.slice(start,end)+"\nglobalThis.__api={A,fresh,act,candidates,progressEfficiency,actionDurabilityCost,effectiveProgressEfficiency,bases,key,simulate,prune,searchMaxDepth,format};\n})();\n";
const ctx={console,performance,setTimeout,clearTimeout,Math,Number,Set,Map,JSON,String,Array,Object,Promise};ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(core,ctx);const api=ctx.__api;
let fail=0,pass=0;function ck(ok,msg){if(ok)pass++;else{fail++;console.log('FAIL',msg)}}
const all=new Set(Object.keys(api.A).filter(id=>id!=='contentAction2'));
function S(over={}){return {effectiveLevel:690,rlvl:690,lv:100,recipeLv:90,expert:false,craft:5778,control:5517,cp:999,dur:80,diff:999999,target:999999,initial:0,pd:170,pm:90,qd:150,qm:75,safeOnly:true,cosmicAction:'none',cosmicSteadyUses:1,enabledSkills:new Set(all),...over}}
function validStateFor(id,s){let x=api.fresh(s);x.step=1; x.iq=10;
 if(api.A[id].first)x.step=0;
 if(id==='trainedEye'){x.step=0;s.recipeLv=Math.min(s.lv-10,90);s.expert=false;}
 if(id==='rapidSynthesis'){x.b.steady=3;}
 if(id==='prudentTouch'||id==='prudentSynthesis')x.b.wn=0;
 return x;
}
const expected={
 basicSynthesis:{lv:1,cp:0,d:10}, basicTouch:{lv:5,cp:18,d:10}, mastersMend:{lv:7,cp:88,d:0}, rapidSynthesis:{lv:9,cp:0,d:10}, observe:{lv:13,cp:7,d:0}, wasteNot:{lv:15,cp:56,d:0}, veneration:{lv:15,cp:18,d:0}, standardTouch:{lv:18,cp:32,d:10}, greatStrides:{lv:21,cp:32,d:0}, innovation:{lv:26,cp:18,d:0}, finalAppraisal:{lv:42,cp:1,d:0}, wasteNot2:{lv:47,cp:98,d:0}, byregot:{lv:50,cp:24,d:10}, muscleMemory:{lv:54,cp:6,d:10}, carefulSynthesis:{lv:62,cp:7,d:10}, manipulation:{lv:65,cp:96,d:0}, prudentTouch:{lv:66,cp:25,d:5}, advancedTouch:{lv:68,cp:46,d:10}, reflect:{lv:69,cp:6,d:10}, preparatoryTouch:{lv:71,cp:40,d:20}, groundwork:{lv:72,cp:18,d:20}, delicateSynthesis:{lv:76,cp:32,d:10}, trainedEye:{lv:80,cp:250,d:0}, prudentSynthesis:{lv:88,cp:18,d:5}, trainedFinesse:{lv:90,cp:32,d:0}, refinedTouch:{lv:92,cp:24,d:10}, perfectMend:{lv:98,cp:112,d:0}, trainedPerfection:{lv:100,cp:0,d:0}
};
for(const [id,e] of Object.entries(expected)){
 const a=api.A[id];ck(!!a,`${id} exists`); if(!a)continue;
 ck(a.lv===e.lv,`${id} level ${a.lv} expected ${e.lv}`);ck(a.cp===e.cp,`${id} CP ${a.cp} expected ${e.cp}`);ck(a.d===e.d,`${id} durability metadata ${a.d} expected ${e.d}`);
 // level gate
 if(e.lv>1){const s=S({lv:e.lv-1});const x=validStateFor(id,s);ck(api.act(x,id,s)===null,`${id} rejected below learn level`)}
 // exact level, ample resources
 {const s=S({lv:e.lv,cp:999});const x=validStateFor(id,s);const y=api.act(x,id,s);ck(!!y,`${id} accepted at learn level under valid prerequisites`)}
 // CP gate (except 0)
 if(e.cp>0){const s=S({cp:e.cp-1});const x=validStateFor(id,s);x.cp=e.cp-1;ck(api.act(x,id,s)===null,`${id} rejected at CP cost-1`)}
}
// Combo CP exact checks
{let s=S();let x=validStateFor('standardTouch',s);x.last='basicTouch';x.cp=18;ck(!!api.act(x,'standardTouch',s),'Standard Touch combo accepted at 18 CP');x=validStateFor('standardTouch',s);x.last='observe';x.cp=18;ck(api.act(x,'standardTouch',s)===null,'Standard Touch noncombo rejected at 18 CP');}
{let s=S();for(const last of ['standardTouch','observe']){let x=validStateFor('advancedTouch',s);x.last=last;x.cp=18;ck(!!api.act(x,'advancedTouch',s),`Advanced Touch combo ${last} accepted at 18 CP`)}let x=validStateFor('advancedTouch',s);x.last='basicTouch';x.cp=18;ck(api.act(x,'advancedTouch',s)===null,'Advanced Touch noncombo rejected at 18 CP');}
// First-step / IQ / WN / once gates
for(const id of ['muscleMemory','reflect','trainedEye']){const s=S();const x=validStateFor(id,s);x.step=1;ck(api.act(x,id,s)===null,`${id} rejected after first step`)}
{const s=S();for(const id of ['prudentTouch','prudentSynthesis']){const x=validStateFor(id,s);x.b.wn=1;ck(api.act(x,id,s)===null,`${id} rejected during Waste Not`)}}
{const s=S();let x=validStateFor('trainedFinesse',s);x.iq=9;ck(api.act(x,'trainedFinesse',s)===null,'Trained Finesse rejects IQ9');x.iq=10;ck(!!api.act(x,'trainedFinesse',s),'Trained Finesse accepts IQ10')}
{const s=S();let x=validStateFor('byregot',s);x.iq=0;ck(api.act(x,'byregot',s)===null,'Byregot rejects IQ0');x.iq=1;ck(!!api.act(x,'byregot',s),'Byregot accepts IQ1')}
{const s=S();let x=validStateFor('trainedPerfection',s);x.usedPerfect=true;ck(api.act(x,'trainedPerfection',s)===null,'Trained Perfection rejects second use')}
// Trained Eye durability and exact effect
{const s=S({lv:100,recipeLv:90,expert:false,dur:40,target:12345});let x=validStateFor('trainedEye',s);x.d=40;const y=api.act(x,'trainedEye',s);ck(!!y&&y.q===12345,'Trained Eye reaches max quality');ck(!!y&&y.d===40,'Trained Eye consumes no durability')}
// Groundwork boundary: only BELOW actual durability cost halves.
for(const wn of [0,2]){const s=S({lv:100});const cost=wn?10:20;for(const d of [cost-1,cost,cost+1]){let x=validStateFor('groundwork',s);x.d=d;x.b.wn=wn;const eff=api.effectiveProgressEfficiency('groundwork',x,s);const expectedEff=d<cost?180:360;ck(eff===expectedEff,`Groundwork WN${wn} durability ${d}, cost ${cost}: eff ${eff} expected ${expectedEff}`)}}
// Trained Perfection persists through non-durability actions, consumed by next durability action.
{const s=S();let x=validStateFor('trainedPerfection',s);x.step=2;x=api.act(x,'trainedPerfection',s);ck(x?.b.perfect===true,'Trained Perfection grants buff');x=api.act(x,'innovation',s);ck(x?.b.perfect===true,'Trained Perfection persists through zero-durability action');const d=x.d;x=api.act(x,'preparatoryTouch',s);ck(x?.b.perfect===false&&x.d===d,'Trained Perfection consumed by durability action and prevents loss')}
// Buff durations exact across Observe steps
for(const [id,buff,n] of [['wasteNot','wn',4],['wasteNot2','wn',8],['veneration','ven',4],['innovation','inn',4],['greatStrides','gs',3],['manipulation','man',8]]){const s=S();let x=validStateFor(id,s);x=api.act(x,id,s);ck(x?.b[buff]===n,`${id} starts ${buff}=${n}`);for(let i=0;i<n;i++)x=api.act(x,'observe',s);ck(x?.b[buff]===0,`${id} expires after ${n} steps`)}
// Final Appraisal no-step and 5 subsequent steps
{const s=S({diff:10000});let x=api.fresh(s);x=api.act(x,'finalAppraisal',s);ck(x?.step===0&&x.b.fa===5,'Final Appraisal no-step and fa5');for(let i=0;i<4;i++)x=api.act(x,'observe',s);ck(x?.b.fa===1,'Final Appraisal has 1 step left after 4 steps')}
// Stellar Steady Hand: Lv90+, consumes activation step, fresh 3-step buff, safe rapid gate.
{let s=S({cosmicAction:'steady',cosmicSteadyUses:1,lv:89});let x=api.fresh(s);ck(api.act(x,'contentAction2',s)===null,'Stellar Steady Hand rejects below Lv90');s=S({cosmicAction:'steady',cosmicSteadyUses:3,lv:90});x=api.fresh(s);for(let use=1;use<=3;use++){x=api.act(x,'contentAction2',s);ck(!!x&&x.cosmicUses===use&&x.b.steady===3,`Stellar Steady Hand use ${use}/3 accepted and refreshes 3 steps`)}ck(api.act(x,'contentAction2',s)===null,'Stellar Steady Hand rejects use beyond configured count');ck(x.step===3,'Three Stellar Steady Hand activations consume three crafting steps')}
// IQ increment families and cap
for(const [id,inc] of [['basicTouch',1],['standardTouch',1],['advancedTouch',1],['reflect',2],['preparatoryTouch',2],['delicateSynthesis',1],['refinedTouch',1]]){const s=S();let x=validStateFor(id,s);x.iq=0;if(api.A[id].first)x.step=0;const y=api.act(x,id,s);ck(!!y&&y.iq===inc,`${id} IQ increment ${inc}`)}
{const s=S();let x=validStateFor('refinedTouch',s);x.iq=5;x.last='basicTouch';const y=api.act(x,'refinedTouch',s);ck(!!y&&y.iq===7,'Refined Touch Basic Touch combo grants total +2 IQ')}
{const s=S();let x=validStateFor('preparatoryTouch',s);x.iq=9;const y=api.act(x,'preparatoryTouch',s);ck(!!y&&y.iq===10,'IQ caps at 10')}
// Byregot resets IQ
{const s=S();let x=validStateFor('byregot',s);x.iq=10;const y=api.act(x,'byregot',s);ck(!!y&&y.iq===0,'Byregot resets IQ')}
// Repairs cap durability
for(const [id,amount] of [['mastersMend',30],['perfectMend',999]]){const s=S({dur:80});let x=validStateFor(id,s);x.d=65;const y=api.act(x,id,s);ck(!!y&&y.d===80,`${id} caps durability at max`)}
// At exact durability cost, normal durability action may complete at zero; if not complete it fails.
{const s=S({diff:1});let x=validStateFor('basicSynthesis',s);x.d=10;const y=api.act(x,'basicSynthesis',s);ck(!!y&&y.done&&y.d===0,'Exact durability cost can complete at zero')}
// Material Miracle is pre-applied as Duty Action II without consuming a crafting step; it still counts toward the 30-action macro cap.
{const s=S({cosmicAction:'miracle'});const x=api.fresh(s);ck(x.log.length===1&&x.log[0]==='contentAction2'&&x.step===0&&x.cosmicUses===1,'Material Miracle is pre-applied once without advancing crafting step');ck(api.searchMaxDepth(s)===29,'Material Miracle leaves 29 searched actions for 30 total');const route=['contentAction2','basicSynthesis'];const p=api.prune(route,{...s,diff:100,target:1,initial:1});ck(p[0]==='contentAction2','prune preserves pre-applied Material Miracle');}
{const s=S({cosmicAction:'steady',cosmicSteadyUses:3});ck(api.searchMaxDepth(s)===30,'Stellar Steady Hand remains inside the 30 searched action cap');const lines=api.format(['contentAction2']).join('\n');ck(lines.includes('<wait.2>'),'Duty Action II macro wait is 2 seconds');}
// A first Stellar Steady Hand is a normal in-search action, not a pre-applied Miracle action; prune may remove it when unnecessary.
{const s=S({cosmicAction:'steady',cosmicSteadyUses:3,diff:100,target:1,initial:1,craft:5778});const route=['contentAction2','basicSynthesis'];const p=api.prune(route,s);ck(p.length===1&&p[0]==='basicSynthesis','prune may remove unnecessary first Stellar Steady Hand')}
console.log(`ACTION_MATRIX pass=${pass} fail=${fail} actions=${Object.keys(expected).length}`);process.exitCode=fail?1:0;
