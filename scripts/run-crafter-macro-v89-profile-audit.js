#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),{performance}=require('perf_hooks');
const root=path.resolve(__dirname,'..'),src=fs.readFileSync(path.join(root,'assets/js/pages/crafter-macro.js'),'utf8');
const st=src.indexOf("(()=>{'use strict';\nconst A="),en=src.indexOf("$('run').addEventListener('click',run);",st);
let core=src.slice(st,en)+"\nglobalThis.api={CURRENT_NORMAL_COEFFICIENTS,resolveRecipeProfile};\n})();";
const c={console,performance,setTimeout,clearTimeout,Math,Number,Set,Map,JSON,String,Array,Object,Promise};c.globalThis=c;vm.createContext(c);vm.runInContext(core,c);const a=c.api;
let pass=0,fail=0; const check=(name,ok,detail)=>{if(ok)pass++;else{fail++;console.error('FAIL',name,detail||'')}};
const expected={}; for(let lv=51;lv<=99;lv++)expected[lv]=a.CURRENT_NORMAL_COEFFICIENTS[lv];
for(let lv=51;lv<=99;lv++){
 const p=a.resolveRecipeProfile(String(lv),{diff:1,target:1,dur:1,playerEffective:999});
 const e=expected[lv];check(`Lv${lv}`,p.recipeLv===lv&&p.pd===e[0]&&p.qd===e[1]&&p.pm===100&&p.qm===100,p);
}
for(const tuple of [[22,200,40],[51,680,40],[420,2750,80],[99999,3,5]]){
 const p=a.resolveRecipeProfile('50',{diff:tuple[0],target:tuple[1],dur:tuple[2],playerEffective:100});
 check(`Lv50以下 tuple independence ${tuple.join('/')}`,!p.resolutionError&&p.pd===50&&p.qd===30&&p.pm===100&&p.qm===100,p);
}
for(const stars of [0,1,2,3,4]){
 const sel=stars?`100s${stars}`:'100';
 for(const tuple of [[6600,12000,80],[10040,21200,70],[123,456,35]]){
  const p=a.resolveRecipeProfile(sel,{diff:tuple[0],target:tuple[1],dur:tuple[2],playerEffective:690});
  check(`${sel} tuple independence ${tuple.join('/')}`,!p.resolutionError&&p.pd===170&&p.pm===90&&p.qd===150&&p.qm===75&&!p.expert,p);
 }
}
{
 const p=a.resolveRecipeProfile('100s5',{diff:11250,target:31520,dur:60,playerEffective:690});
 check('Lv100★5 high-difficulty profile',p.pd===180&&p.pm===100&&p.qd===180&&p.qm===100&&p.expert,p);
}
const real=[
 ['蜜蝋','50',22,200,40],["鬼にかわ",'50',51,680,40],['上質な薪','50',420,2750,80],['刺繍糸','60',740,2900,70],['羅刹剣','70',1500,6100,70],['心力の幻水G4','80',2340,7125,35],['ディアドコス','90',6600,14040,70],['カザナル','100',6600,12000,80],['エヌオー・ロッドスタンド','100s4',10040,21200,70]
];
for(const [name,sel,diff,target,dur] of real){const p=a.resolveRecipeProfile(sel,{diff,target,dur,playerEffective:690});check(`real recipe resolves: ${name}`,!p.resolutionError,p)}
console.log(JSON.stringify({pass,fail,total:pass+fail}));process.exitCode=fail?1:0;
