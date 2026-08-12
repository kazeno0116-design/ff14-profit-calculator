#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),{performance}=require('perf_hooks');
const root=path.resolve(__dirname,'..'),src=fs.readFileSync(path.join(root,'assets/js/pages/crafter-macro.js'),'utf8');
const st=src.indexOf("(()=>{'use strict';\nconst A="),en=src.indexOf("$('run').addEventListener('click',run);",st);
let core=src.slice(st,en)+"\nglobalThis.api={A,fresh,act,bases,progressEfficiency,actionDurabilityCost};\n})();";
const c={console,performance,setTimeout,clearTimeout,Math,Number,Set,Map,JSON,String,Array,Object,Promise};c.globalThis=c;vm.createContext(c);vm.runInContext(core,c);const api=c.api;
const ids=Object.keys(api.A).filter(id=>id!=='contentAction2'),all=new Set(ids);
const max={ven:4,inn:4,gs:3,man:8,wn:8,mm:5,fa:5,steady:3};
let checks=0,fail=0,trans=0;function ck(ok,msg){checks++;if(!ok){fail++;if(fail<=30)console.log('FAIL',msg)}}
function S(o={}){return{effectiveLevel:690,rlvl:690,lv:100,recipeLv:90,expert:false,craft:5778,control:5517,cp:999,dur:80,diff:999999,target:999999,initial:0,pd:170,pm:90,qd:150,qm:75,safeOnly:false,cosmicAction:'none',cosmicSteadyUses:1,enabledSkills:new Set(all),eye:true,...o}}
// Enumerate all 3^8 buff-counter equivalence classes (off, 1 turn, max turns).
const keys=Object.keys(max),states=[];for(let n=0;n<3**keys.length;n++){let v=n,b={};for(const k of keys){const d=v%3;v=Math.floor(v/3);b[k]=d===0?0:d===1?1:max[k]}states.push(b)}
const durVals=[5,10,20],iqVals=[0,10];
for(const id of ids){const a=api.A[id];
 for(const b0 of states)for(const d of durVals)for(const iq of iqVals){for(const perfect of [false,true]){
  const s=S();let x=api.fresh(s);x.step=a.first?0:2;x.d=d;x.iq=iq;x.cp=999;x.last='';x.b={...x.b,...b0,perfect};
  if(a.needIQ10)x.iq=10;if(id==='byregot'&&x.iq===0)x.iq=1;if(id==='trainedEye'){x.step=0;s.recipeLv=90;s.expert=false}if((id==='prudentTouch'||id==='prudentSynthesis')&&x.b.wn>0)continue;
  const pre={...x,b:{...x.b}},y=api.act(x,id,s);if(!y)continue;trans++;
  ck(y.cp>=0&&y.cp<=pre.cp,`${id} cp bounds`);ck(y.d>=0&&y.d<=s.dur,`${id} dur bounds`);ck(y.p>=pre.p&&y.p<=s.diff,`${id} progress bounds`);ck(y.q>=pre.q&&y.q<=s.target,`${id} quality bounds`);ck(y.iq>=0&&y.iq<=10,`${id} IQ bounds`);
  ck(y.step===pre.step+(a.nostep?0:1),`${id} step delta`);
  // Exact CP, including combo-cost states (this matrix uses no combo last action).
  ck(pre.cp-y.cp===a.cp,`${id} exact CP ${pre.cp-y.cp} != ${a.cp}`);
  // Zero-durability utility actions never lose durability; repair actions only restore/cap.
  if(a.d===0&&!['mastersMend','perfectMend'].includes(id)){
    const expected=(pre.b.man>0&&!a.nostep&&!y.done)?Math.min(s.dur,pre.d+5):pre.d;
    ck(y.d===expected,`${id} zero-cost durability expected ${expected}, got ${y.d}`);
  }
  // Every non-refreshed active step buff ticks by one on a normal-step utility action.
  if(!a.nostep&&!a.p&&!a.q&&!a.e){for(const k of keys){if(id==='contentAction2'&&k==='steady')continue;const expected=Math.max(0,pre.b[k]-1);ck(y.b[k]===expected,`${id}/${k} utility tick ${y.b[k]} != ${expected}`)}}
 }}
}
// Combo CP states separately.
for(const [id,last,cost] of [['standardTouch','basicTouch',18],['advancedTouch','standardTouch',18],['advancedTouch','observe',18]]){const s=S();let x=api.fresh(s);x.step=2;x.iq=5;x.last=last;const cp=x.cp;const y=api.act(x,id,s);ck(!!y&&cp-y.cp===cost,`${id} combo ${last} CP=${cost}`)}
// Refined Touch combo total IQ gain is +2, noncombo +1.
{const s=S();for(const [last,inc] of [['basicTouch',2],['observe',1]]){let x=api.fresh(s);x.step=2;x.iq=4;x.last=last;const y=api.act(x,'refinedTouch',s);ck(!!y&&y.iq===4+inc,`Refined Touch ${last} IQ +${inc}`)}}
console.log(`FULL_ACTION_STATE_ORACLE actions=${ids.length} buffStates=${states.length} transitions=${trans} checks=${checks} fail=${fail}`);process.exitCode=fail?1:0;
