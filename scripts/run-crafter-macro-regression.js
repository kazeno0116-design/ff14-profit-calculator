#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),{performance}=require('perf_hooks');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/js/pages/crafter-macro.js'),'utf8');
const marker="$('run').addEventListener('click',run);";
const start=source.indexOf("(()=>{'use strict';\nconst A=");
const end=source.indexOf(marker,start);
if(start<0||end<0)throw new Error('Unable to isolate crafter core');
let core=source.slice(start,end);
core += "\nglobalThis.__crafterTestAPI={A,PLAYER_LEVEL_TABLE,resolveRecipeProfile,bases,search,isGoal};\n})();\n";
const context={console,performance,setTimeout,clearTimeout,Math,Number,Set,Map,JSON,String,Array,Object,Promise};
context.globalThis=context;
vm.createContext(context);
vm.runInContext(core,context,{filename:'crafter-macro-core.js'});
const api=context.__crafterTestAPI;
const data=JSON.parse(fs.readFileSync(path.join(root,'scripts/crafter-macro-regression-cases.json'),'utf8'));
let failed=0;
function check(ok,msg){console.log(`${ok?'PASS':'FAIL'} ${msg}`);if(!ok)failed++;}
function playerEffective(lv){return api.PLAYER_LEVEL_TABLE[lv]||lv}
function selectionFor(recipe){if(recipe.type==='cosmic'||recipe.type==='cosmicExpert')return recipe.type;if(recipe.recipeLevel===100&&Number.isInteger(recipe.stars))return recipe.stars?`100s${recipe.stars}`:'100';return String(recipe.recipeLevel)}
function makeState(t){
 const p={...data.playerDefaults,...(t.player||{})},r=t.recipe,eff=playerEffective(p.level);
 const profile=api.resolveRecipeProfile(selectionFor(r),{diff:r.difficulty,target:r.maxQuality,dur:r.durability,playerEffective:eff});
 return {profile,p,s:profile.resolutionError?null:{...profile,effectiveLevel:eff,lv:p.level,craft:p.craftsmanship,control:p.control,cp:p.cp,dur:r.durability,diff:r.difficulty,target:r.maxQuality,initial:p.initialQuality||0,eye:false,safeOnly:true,cosmicAction:'none',enabledSkills:new Set(Object.keys(api.A).filter(id=>id!=='contentAction2'))}};
}
(async()=>{
 for(const t of data.formulaChecks||[]){const {profile,s}=makeState(t);check(!profile.resolutionError,`${t.id}: profile resolves`);if(!s)continue;const b=api.bases(s),basicSynthesis=Math.floor(b.p*1.2),basicTouch=b.q;check(basicSynthesis===t.expected.basicSynthesis&&basicTouch===t.expected.basicTouch,`${t.id}: Basic Synthesis ${basicSynthesis}, Basic Touch ${basicTouch}`)}
 for(const t of data.rejectionChecks||[]){const {profile}=makeState(t);check(!!profile.resolutionError,`${t.id}: unsupported recipe rejected`)}
 for(const t of data.searchChecks||[]){const {profile,s}=makeState(t);check(!profile.resolutionError,`${t.id}: profile resolves`);if(!s)continue;const x=await api.search(s,{beamWidth:t.beamWidth||5000,timeLimit:t.timeLimit||15000,maxDepth:30});check(!!x&&api.isGoal(x,s),`${t.id}: completes and reaches max quality`);if(x&&t.expected?.maxActions)check(x.log.length<=t.expected.maxActions,`${t.id}: actions ${x.log.length} <= ${t.expected.maxActions}`)}
 console.log(failed?`\n${failed} regression check(s) failed.`:'\nAll regression checks passed.');
 process.exitCode=failed?1:0;
})().catch(e=>{console.error(e);process.exitCode=1});
