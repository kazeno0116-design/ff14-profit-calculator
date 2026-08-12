#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),{performance}=require('perf_hooks');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'assets/js/pages/crafter-macro.js'),'utf8');
const start=source.indexOf("(()=>{'use strict';\nconst A="),end=source.indexOf("$('run').addEventListener('click',run);",start);
let core=source.slice(start,end)+"\nglobalThis.api={A,fresh,act,simulate,format,PLAYER_LEVEL_TABLE,resolveRecipeProfile,bases,isGoal};\n})();";
const ctx={console,performance,setTimeout,clearTimeout,Math,Number,Set,Map,JSON,String,Array,Object,Promise};ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(core,ctx);const a=ctx.api;
const ALL=new Set(Object.keys(a.A).filter(id=>id!=='contentAction2')); let pass=0,fail=0;
function ok(c,m,d){if(c)pass++;else{fail++;console.error('FAIL',m,d||'')}}
function prof(sel='100',lv=100){const p=a.resolveRecipeProfile(sel,{playerEffective:a.PLAYER_LEVEL_TABLE[lv]||lv});return{...p,effectiveLevel:a.PLAYER_LEVEL_TABLE[lv]||lv,lv,craft:5778,control:5517,cp:633,dur:80,diff:999999,target:999999,initial:0,eye:false,safeOnly:false,cosmicAction:'none',cosmicSteadyUses:1,enabledSkills:new Set(ALL)}}
const base=prof();
// CP exact and CP-1 for all positive-CP actions
for(const [id,m] of Object.entries(a.A)){
 if(id==='contentAction2'||!m.cp)continue; const s={...base,cp:m.cp,recipeLv:id==='trainedEye'?80:100,expert:false}; let st=a.fresh(s);st.step=m.first?0:1;st.iq=m.needIQ10?10:(id==='byregot'?1:0);st.last='';
 ok(!!a.act({...st,cp:m.cp},id,s),`CP exact ${id}`); ok(a.act({...st,cp:m.cp-1},id,{...s,cp:m.cp-1})===null,`CP-1 ${id}`);
}
for(const [id,last] of [['standardTouch','basicTouch'],['advancedTouch','standardTouch'],['advancedTouch','observe']]){const s={...base,cp:18};let st=a.fresh(s);st.step=1;st.last=last;ok(!!a.act({...st,cp:18},id,s),`combo18 ${last}->${id}`);ok(a.act({...st,cp:17},id,{...s,cp:17})===null,`combo17 ${last}->${id}`)}
// durability zero completion vs noncompletion
for(const id of ['basicSynthesis','rapidSynthesis','muscleMemory','groundwork','prudentSynthesis','carefulSynthesis','delicateSynthesis']){const m=a.A[id],d=m.d||10,s={...base,dur:d,diff:1};let st=a.fresh(s);st.step=m.first?0:1;st.d=d;const f=a.act(st,id,s);ok(!!f&&f.done&&f.d===0,`finish d0 ${id}`);const s2={...s,diff:999999};st=a.fresh(s2);st.step=m.first?0:1;st.d=d;ok(a.act(st,id,s2)===null,`nonfinish d0 rejected ${id}`)}
// monotonic base values over 26k+ adjacent-ish samples across levels
let mono=0;for(const lv of [10,20,30,40,50,51,60,70,80,90,91,99,100]){const sel=lv<=50?'50':String(lv),p=a.resolveRecipeProfile(sel,{playerEffective:a.PLAYER_LEVEL_TABLE[lv]||lv});let pp=-1,qq=-1;for(let v=1;v<=7000;v+=3){const s={...p,effectiveLevel:a.PLAYER_LEVEL_TABLE[lv]||lv,lv,craft:v,control:v,cp:500,dur:80,diff:1000,target:5000,initial:0,enabledSkills:new Set(ALL),safeOnly:true,cosmicAction:'none'};const b=a.bases(s);ok(b.p>=pp,`p monotonic lv${lv} v${v}`,{pp,b:b.p});ok(b.q>=qq,`q monotonic lv${lv} v${v}`,{qq,b:b.q});pp=b.p;qq=b.q;mono+=2}}
// format exact line counts for every action count and name/wait roundtrip metadata
for(let n=1;n<=30;n++){const ids=Array.from({length:n},()=> 'basicSynthesis'),parts=a.format(ids);ok(parts.every(x=>x.split('\n').length<=15),`format <=15 n${n}`);const actionLines=parts.join('\n').split('\n').filter(x=>x.startsWith('/ac '));ok(actionLines.length===n,`format no loss n${n}`);}
// all action names unique and macro wait metadata sane
const names=new Set();for(const [id,m] of Object.entries(a.A)){ok(!names.has(m.n),`unique JP action name ${m.n}`);names.add(m.n);ok(Number.isInteger(m.w)&&m.w>=2&&m.w<=3,`wait 2/3 ${id}`,m.w)}
console.log(JSON.stringify({pass,fail,monotonicChecks:mono},null,2));process.exitCode=fail?1:0;
