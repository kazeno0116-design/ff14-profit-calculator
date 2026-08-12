#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),{performance}=require('perf_hooks');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/js/pages/crafter-macro.js'),'utf8');
const start=source.indexOf("(()=>{'use strict';\nconst A="),end=source.indexOf("$('run').addEventListener('click',run);",start);
let core=source.slice(start,end)+"\nglobalThis.api={A,searchOptimizedExact,macroWait,isGoal,PLAYER_LEVEL_TABLE,resolveRecipeProfile};\n})();";
const ctx={console,performance,setTimeout,clearTimeout,Math,Number,Set,Map,JSON,String,Array,Object,Promise};ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(core,ctx);
const a=ctx.api,ALL=new Set(Object.keys(a.A).filter(id=>id!=='contentAction2'));
const eff=a.PLAYER_LEVEL_TABLE[100],profile=a.resolveRecipeProfile('100s2',{diff:8050,target:17600,dur:70,playerEffective:eff});
const s={...profile,effectiveLevel:eff,lv:100,craft:5778,control:5517,cp:633,dur:70,diff:8050,target:17600,initial:8800,eye:false,safeOnly:true,cosmicAction:'none',cosmicSteadyUses:1,enabledSkills:new Set(ALL)};
const expected=['muscleMemory','wasteNot2','veneration','groundwork','groundwork','innovation','delicateSynthesis','preparatoryTouch','preparatoryTouch','delicateSynthesis','perfectMend','preparatoryTouch','preparatoryTouch','greatStrides','byregot','veneration','groundwork'];
let fail=0,signature=null;const check=(ok,msg)=>{console.log(`${ok?'PASS':'FAIL'} ${msg}`);if(!ok)fail++};
(async()=>{
 for(let i=1;i<=2;i++){
  const t=performance.now(),x=await a.searchOptimizedExact(s),ms=Math.round(performance.now()-t),sig=x?.log.join('|');
  check(!!x&&a.isGoal(x,s),`Ceviche run ${i}: max-quality completion`);
  check(x?.log.length===17&&a.macroWait(x)===46,`Ceviche run ${i}: 17 actions / 46 sec`);
  check(x?.cp===29&&x?.d===0,`Ceviche run ${i}: CP29 / durability0`);
  check(sig===expected.join('|'),`Ceviche run ${i}: matches real-machine verified route`);
  if(signature!==null)check(sig===signature,`Ceviche run ${i}: deterministic repeat`);
  signature=sig;console.log(`INFO Ceviche run ${i}: ${ms}ms`);
 }
 console.log(fail?`\n${fail} V91 deterministic exact check(s) failed.`:'\nAll V91 deterministic exact checks passed.');
 process.exitCode=fail?1:0;
})().catch(e=>{console.error(e);process.exitCode=1});
