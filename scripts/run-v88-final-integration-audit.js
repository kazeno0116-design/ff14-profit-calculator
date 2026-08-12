#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),{performance}=require('perf_hooks');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/js/pages/crafter-macro.js'),'utf8');
const marker="$ ('run')".replace(' ','');
const start=source.indexOf("(()=>{'use strict';\nconst A=");
const end=source.indexOf("$('run').addEventListener('click',run);",start);
if(start<0||end<0)throw Error('core isolate failed');
let core=source.slice(start,end)+"\nglobalThis.api={A,fresh,act,candidates,key,simulate,prune,pruneCompletedBest,isGoal,betterCompletedCandidate,search,findBestCompletedRoute,format};\n})();\n";
const ctx={console,performance,setTimeout,clearTimeout,Math,Number,Set,Map,JSON,String,Array,Object,Promise};ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(core,ctx);const a=ctx.api;
let fail=0,pass=0;function ok(v,m){v?pass++:(fail++,console.error('FAIL',m));if(v)console.log('PASS',m)}
const all=new Set(Object.keys(a.A).filter(x=>x!=='contentAction2'));
const base={effectiveLevel:690,rlvl:690,recipeLv:100,lv:100,craft:5778,control:5517,cp:999,dur:80,diff:999999,target:999999,initial:0,pd:170,pm:90,qd:150,qm:75,safeOnly:true,cosmicAction:'none',enabledSkills:all,expert:false};
// Prune fixed point: removing one observe can make another removable; both must disappear.
const pS={...base,diff:1,target:0,initial:0};
const pr=a.prune(['observe','observe','basicSynthesis'],pS);ok(pr.length===1&&pr[0]==='basicSynthesis','prune reaches fixed point for cascading redundant actions');
// Steady charges: candidates, state key, cap, and fresh charge model.
for(const uses of [1,2,3]){const s={...base,cosmicAction:'steady',cosmicSteadyUses:uses};let st=a.fresh(s);ok(a.candidates(st,s).includes('contentAction2'),`steady ${uses}: initially offered`);for(let i=0;i<uses;i++){const before=a.key(st);st=a.act(st,'contentAction2',s);ok(!!st,`steady ${uses}: use ${i+1} accepted`);ok(a.key(st)!==before,`steady ${uses}: key changes after use ${i+1}`)}ok(!a.candidates(st,s).includes('contentAction2'),`steady ${uses}: not offered after cap`);ok(a.act(st,'contentAction2',s)===null,`steady ${uses}: execution rejects over cap`)}
// Miracle remains pre-applied and protected from prune.
{const s={...pS,cosmicAction:'miracle'};const f=a.fresh(s);ok(f.log[0]==='contentAction2'&&f.cosmicUses===1,'miracle pre-applied once');const q=a.prune(['contentAction2','basicSynthesis'],s);ok(q[0]==='contentAction2','miracle pre-action is retained by prune')}
// Formatting max depth including three steady actions stays <=15 lines per macro.
{const ids=Array.from({length:30},(_,i)=>i%10===0?'contentAction2':'basicSynthesis');const parts=a.format(ids);ok(parts.every(x=>x.split('\n').length<=15),'30-action format stays within 15 lines')}
// UI integration/static assertions.
const html=fs.readFileSync(path.join(root,'crafter/macro/index.html'),'utf8');
ok(/id="cosmicSteadyUses"/.test(html)&&/value="3">3回/.test(html),'UI exposes steady-use selector 1-3');
ok(source.includes("cosmicSteadyUses:Math.max(1,Math.min(3")&&source.includes("d.cosmicSteadyUses"),'steady-use setting is saved and restored');
ok(source.includes("for(const id of ['cosmicSteadyToggle','cosmicMiracleToggle','cosmicSteadyUses'])"),'steady-use changes trigger persistence');
// No known bad metadata regression.
ok(a.A.trainedEye.d===0,'Trained Eye durability cost remains zero');ok(a.A.contentAction2.lv===90,'Cosmic Steady Hand level remains 90');
console.log(`FINAL_INTEGRATION pass=${pass} fail=${fail}`);process.exit(fail?1:0);
