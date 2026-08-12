#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),{performance}=require('perf_hooks');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/js/pages/crafter-macro.js'),'utf8');
const marker="$'"; // unused
const start=source.indexOf("(()=>{'use strict';\nconst A=");
const end=source.indexOf("$('run').addEventListener('click',run);",start);
let core=source.slice(start,end)+"\nglobalThis.__api={A,PLAYER_LEVEL_TABLE,resolveRecipeProfile,fresh,act,candidates,key,simulate,isGoal,format,searchMaxDepth,findBestCompletedRoute,pruneCompletedBest};\n})();\n";
const c={console,performance,setTimeout,clearTimeout,Math,Number,Set,Map,JSON,String,Array,Object,Promise};c.globalThis=c;vm.createContext(c);vm.runInContext(core,c);const api=c.__api;
let fail=0,trans=0;function check(ok,msg){if(!ok){console.log('FAIL '+msg);fail++}}
function ri(a,b){return a+Math.floor(Math.random()*(b-a+1))}
function makeS(){
 const lv=ri(1,100), sel=lv===100?'100':String(lv), eff=api.PLAYER_LEVEL_TABLE[lv]||lv;
 let prof=api.resolveRecipeProfile(sel,{}); if(prof.resolutionError) prof={recipeLv:lv,rlvl:eff,pd:lv<=50?50:170,qd:lv<=50?30:150,pm:100,qm:100};
 return {...prof,effectiveLevel:eff,lv,craft:ri(100,6500),control:ri(100,6000),cp:ri(100,800),dur:[20,30,35,40,60,70,80][ri(0,6)],diff:ri(100,15000),target:ri(100,30000),initial:0,eye:false,safeOnly:true,cosmicAction:'none',enabledSkills:new Set(Object.keys(api.A).filter(id=>id!=='contentAction2'))};
}
for(let n=0;n<12000;n++){
 const s=makeS();let x=api.fresh(s);
 for(let step=0;step<30&&!x.done&&!x.failed;step++){
   const z=api.candidates(x,s);
   check(z.every(id=>id==='contentAction2'||s.enabledSkills.has(id)),'candidate contains disabled skill');
   const usable=[];for(const id of z){const y=api.act(x,id,s);if(y)usable.push([id,y])}
   if(!usable.length)break;
   const [id,y]=usable[ri(0,usable.length-1)]; trans++;
   check(Number.isFinite(y.p)&&Number.isFinite(y.q)&&Number.isFinite(y.cp)&&Number.isFinite(y.d),'non-finite state');
   check(y.p>=0&&y.p<=s.diff,'progress out of range');check(y.q>=0&&y.q<=s.target,'quality out of range');
   check(y.cp>=0,'negative CP');check(y.d>=0&&y.d<=s.dur,'durability out of range');check(y.iq>=0&&y.iq<=10,'IQ out of range');
   check(y.step>=x.step,'step went backwards');
   if(y.done){check(y.p===s.diff,'done without capped progress');check(!y.failed,'done and failed simultaneously')}
   x=y;
 }
}
// State identity: every future-relevant scalar/buff must affect key.
const s={...makeS(),lv:100,effectiveLevel:690,rlvl:690,cosmicAction:'none'};const base=api.fresh(s);base.step=3;base.p=10;base.q=20;base.d=30;base.cp=40;base.iq=2;base.last='basicTouch';
const mutations=[['step',4],['p',11],['q',21],['d',31],['cp',41],['iq',3],['last','observe'],['usedPerfect',true],['cosmicUses',2]];
for(const [k,v] of mutations){const y={...base,[k]:v,b:{...base.b}};check(api.key(base)!==api.key(y),`key misses ${k}`)}
for(const k of ['ven','inn','gs','man','wn','mm','fa','steady']){const y={...base,b:{...base.b,[k]:1}};check(api.key(base)!==api.key(y),`key misses buff ${k}`)}
{const y={...base,b:{...base.b,perfect:true}};check(api.key(base)!==api.key(y),'key misses buff perfect')}
// Macro packing all lengths 1..30.
for(let n=1;n<=30;n++){const parts=api.format(Array(n).fill('basicSynthesis'));check(parts.every(p=>p.split('\n').length<=15),`macro line overflow at ${n}`)}
console.log(`Fuzz transitions=${trans}, failures=${fail}`);process.exitCode=fail?1:0;
