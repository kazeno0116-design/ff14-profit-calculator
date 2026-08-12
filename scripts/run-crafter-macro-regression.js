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
core += "\nglobalThis.__crafterTestAPI={A,PLAYER_LEVEL_TABLE,resolveRecipeProfile,bases,search,isGoal,fresh,key,searchMaxDepth,act,candidates,safeDominates,progressEfficiency,shouldOfferFinalAppraisal,simulate,prune,normalizeBuffOrder,format,effectiveProgressEfficiency,actionDurabilityCost,betterCompletedCandidate,optimizeCompletedCandidate,optimizeExactCandidate,findBestCompletedRoute};\n})();\n";
const context={console,performance,setTimeout,clearTimeout,Math,Number,Set,Map,JSON,String,Array,Object,Promise};
context.globalThis=context;
vm.createContext(context);
vm.runInContext(core,context,{filename:'crafter-macro-core.js'});
const api=context.__crafterTestAPI;
const data=JSON.parse(fs.readFileSync(path.join(root,'scripts/crafter-macro-regression-cases.json'),'utf8'));
let failed=0;
function check(ok,msg){console.log(`${ok?'PASS':'FAIL'} ${msg}`);if(!ok)failed++;}
check(api.A.observe.w===3,'Observe uses wait.3 for reliable macro execution');
check(api.A.finalAppraisal.w===3,'Final Appraisal uses wait.3 for reliable macro execution');
check(api.A.veneration.w===2&&api.A.innovation.w===2&&api.A.wasteNot.w===2&&api.A.wasteNot2.w===2&&api.A.greatStrides.w===2&&api.A.manipulation.w===2,'known buff actions retain wait.2');
function playerEffective(lv){return api.PLAYER_LEVEL_TABLE[lv]||lv}
function selectionFor(recipe){if(recipe.type==='cosmic'||recipe.type==='cosmicExpert')return recipe.type;if(recipe.recipeLevel===100&&Number.isInteger(recipe.stars))return recipe.stars?`100s${recipe.stars}`:'100';return String(recipe.recipeLevel)}
function makeState(t){
 const p={...data.playerDefaults,...(t.player||{})},r=t.recipe,eff=playerEffective(p.level);
 const profile=api.resolveRecipeProfile(selectionFor(r),{diff:r.difficulty,target:r.maxQuality,dur:r.durability,playerEffective:eff});
 return {profile,p,s:profile.resolutionError?null:{...profile,effectiveLevel:eff,lv:p.level,craft:p.craftsmanship,control:p.control,cp:p.cp,dur:r.durability,diff:r.difficulty,target:r.maxQuality,initial:p.initialQuality||0,eye:false,safeOnly:true,cosmicAction:'none',enabledSkills:new Set(Object.keys(api.A).filter(id=>id!=='contentAction2'))}};
}
(async()=>{
 const dummy={cosmicAction:'none',initial:0,dur:80,cp:600};
 const a=api.fresh(dummy),b={...a,usedPerfect:true};
 check(api.key(a)!==api.key(b),'state key distinguishes unused/used Trained Perfection');
 check(api.searchMaxDepth({cosmicAction:'none'})===30,'max depth: no cosmic action = 30');
 check(api.searchMaxDepth({cosmicAction:'steady'})===30,'max depth: Cosmic Steady Hand = 30');
 check(api.searchMaxDepth({cosmicAction:'miracle'})===29,'max depth: Miracle Material = 29 + pre-applied action');
 // V81 safety regressions
 const testS={effectiveLevel:690,rlvl:690,lv:100,craft:5778,control:5517,cp:633,dur:80,diff:10000,target:10000,initial:0,pd:170,pm:90,qd:150,qm:75,safeOnly:true,cosmicAction:'none',enabledSkills:new Set(Object.keys(api.A).filter(id=>id!=='contentAction2'))};
 const wnState=api.fresh(testS);wnState.b.wn=3;wnState.step=1;
 check(!!api.act(wnState,'finalAppraisal',testS),'Final Appraisal remains usable during Waste Not (official behavior)');
 const iq0=api.fresh(testS);iq0.step=1;
 check(api.act(iq0,'byregot',testS)===null,'Byregot is rejected at Inner Quiet 0');
 const faOff={...testS,enabledSkills:new Set([...testS.enabledSkills].filter(id=>id!=='finalAppraisal'))};
 const highProgress=api.fresh(faOff);highProgress.p=9000;highProgress.step=2;
 check(!api.candidates(highProgress,faOff).includes('finalAppraisal'),'disabled Final Appraisal does not re-enter candidates');
 const maxQState=api.fresh(testS);maxQState.q=testS.target;maxQState.step=2;
 check(api.candidates(maxQState,testS).includes('delicateSynthesis'),'Delicate Synthesis remains available after max quality for progress');
 const lowDur={...api.fresh(testS),p:testS.diff-100,d:5,step:2};
 const finishAtZero=api.act(lowDur,'basicSynthesis',testS);
 check(!!finishAtZero&&finishAtZero.done&&finishAtZero.d===0,'finishing action may complete at durability 0');
 const step0=api.fresh(testS),step1={...step0,step:1};
 check(api.key(step0)!==api.key(step1),'state key distinguishes different step counts');
 const waitOf=x=>x.wait||0;
 const domA={p:500,q:500,d:40,cp:300,wait:10},domB={p:400,q:400,d:40,cp:250,wait:11};
 check(!api.safeDominates(domA,domB,waitOf),'dominance does not treat higher progress as universally better');
 const domC={p:500,q:500,d:50,cp:300,wait:10},domD={p:500,q:400,d:40,cp:250,wait:11};
 check(!api.safeDominates(domC,domD,waitOf),'dominance does not merge different durability states');
 const domE={p:500,q:500,d:40,cp:300,wait:10},domF={p:500,q:400,d:40,cp:250,wait:11};
 check(api.safeDominates(domE,domF,waitOf),'dominance still prunes strictly safer same-progress/durability state');

 // V87: portfolio candidates are optimized before cross-lane comparison.
 const optS={...testS,diff:1,target:999999,initial:0};
 const redundant=['observe','observe','basicSynthesis'];
 const redundantX=api.simulate(redundant,optS);
 const optimizedCompleted=api.optimizeCompletedCandidate(redundantX,optS);
 check(!!optimizedCompleted&&optimizedCompleted.log.length===1&&optimizedCompleted.log[0]==='basicSynthesis','V87 best-effort candidate is pruned before portfolio comparison');
 const exactOptS={...testS,diff:1,target:1,initial:1};
 const exactRedundantX=api.simulate(redundant,exactOptS);
 const optimizedExact=api.optimizeExactCandidate(exactRedundantX,exactOptS);
 check(!!optimizedExact&&optimizedExact.log.length===1&&api.isGoal(optimizedExact,exactOptS),'V87 exact portfolio candidate is pruned before comparison');
 // V83: Inner Quiet is learned at Lv11.
 const lowIqBase={effectiveLevel:5,rlvl:5,lv:5,craft:100,control:100,cp:999,dur:80,diff:99999,target:99999,initial:0,pd:50,pm:100,qd:30,qm:100,safeOnly:true,cosmicAction:'none',enabledSkills:new Set(Object.keys(api.A).filter(id=>id!=='contentAction2'))};
 let lowIq=api.act(api.fresh(lowIqBase),'basicTouch',lowIqBase);const lowQ1=lowIq?.q;lowIq=api.act(lowIq,'basicTouch',lowIqBase);
 check(!!lowIq&&lowIq.iq===0&&lowIq.q===lowQ1*2,'Lv10 and below do not gain Inner Quiet');
 const lv11={...lowIqBase,lv:11,effectiveLevel:11};let iq11=api.act(api.fresh(lv11),'basicTouch',lv11);iq11=api.act(iq11,'basicTouch',lv11);
 check(!!iq11&&iq11.iq===2&&iq11.q>lowQ1*2,'Lv11 gains Inner Quiet and quality scaling');
 // V83: same-quality best-effort ranking is actions -> wait, never remaining CP.
 const shortLowCp={q:500,cp:10,log:['basicSynthesis']},longHighCp={q:500,cp:999,log:['veneration','basicSynthesis']};
 check(api.betterCompletedCandidate(shortLowCp,longHighCp),'best-effort same quality prefers fewer actions over remaining CP');
 const sameLenFast={q:500,cp:1,log:['veneration','basicSynthesis']},sameLenSlow={q:500,cp:999,log:['basicSynthesis','basicSynthesis']};
 check(api.betterCompletedCandidate(sameLenFast,sameLenSlow),'best-effort same quality/action-count prefers shorter wait');
 // V84: Trained Eye legality is enforced by the simulator itself, not only by candidate generation.
 const eyeLegalBase={...testS,lv:100,recipeLv:90,expert:false};
 check(!!api.act(api.fresh(eyeLegalBase),'trainedEye',eyeLegalBase),'Trained Eye accepted when recipe is 10 levels lower and non-expert');
 const eyeTooHigh={...eyeLegalBase,recipeLv:91};
 check(api.act(api.fresh(eyeTooHigh),'trainedEye',eyeTooHigh)===null,'Trained Eye rejected when recipe is less than 10 levels lower');
 const eyeExpert={...eyeLegalBase,expert:true};
 check(api.act(api.fresh(eyeExpert),'trainedEye',eyeExpert)===null,'Trained Eye rejected on expert recipes');
 check(api.A.trainedEye.d===0,'Trained Eye metadata has zero durability cost');
 {const st=api.fresh(eyeLegalBase),before=st.d,y=api.act(st,'trainedEye',eyeLegalBase);check(!!y&&y.d===before,'Trained Eye consumes no durability');}
 // Groundwork halves only when current durability is below the ACTUAL durability cost.
 for(const [wn,cost] of [[0,20],[2,10]]){for(const d of [cost-1,cost]){const gs={...testS,lv:100};let st=api.fresh(gs);st.d=d;st.b.wn=wn;const eff=api.effectiveProgressEfficiency('groundwork',st,gs);check(eff===(d<cost?180:360),`Groundwork WN${wn} durability ${d}/cost ${cost} efficiency ${eff}`)}}

 // V83: Cosmic Steady Hand consumes one crafting step, ticks existing buffs, but grants a fresh 3-turn success buff.
 const cosmicStepS={...testS,cosmic:true,cosmicAction:'steady'};let cosmicStep=api.fresh(cosmicStepS);cosmicStep.step=5;cosmicStep.d=40;cosmicStep.b.ven=2;cosmicStep.b.man=2;
 const cosmicAfter=api.act(cosmicStep,'contentAction2',cosmicStepS);
 check(!!cosmicAfter&&cosmicAfter.step===6&&cosmicAfter.b.ven===1&&cosmicAfter.b.man===1&&cosmicAfter.b.steady===3&&cosmicAfter.d===45,'Cosmic Steady Hand consumes a step and ticks existing buffs while keeping fresh steady=3');
 // V88: configured Stellar Steady Hand charges are part of the state, key and execution limit.
 {const cs={...testS,cosmic:true,cosmicAction:'steady',cosmicSteadyUses:3};let st=api.fresh(cs);for(let i=1;i<=3;i++){st=api.act(st,'contentAction2',cs);check(!!st&&st.cosmicUses===i,`Cosmic Steady Hand use ${i}/3 accepted`)}check(api.act(st,'contentAction2',cs)===null,'Cosmic Steady Hand rejects use 4/3');}

 // Cross-check common buff lifecycles and combo accounting independently of known recipe macros.
 const lifeS={...testS,diff:999999,target:999999};
 let ven=api.act(api.fresh(lifeS),'veneration',lifeS);
 check(ven?.b.ven===4,'Veneration starts with 4 future steps');
 for(let i=0;i<4;i++)ven=api.act(ven,'observe',lifeS);
 check(ven?.b.ven===0,'Veneration expires after exactly 4 subsequent steps');
 let inn=api.act(api.fresh(lifeS),'innovation',lifeS);
 check(inn?.b.inn===4,'Innovation starts with 4 future steps');
 for(let i=0;i<4;i++)inn=api.act(inn,'observe',lifeS);
 check(inn?.b.inn===0,'Innovation expires after exactly 4 subsequent steps');
 let wn=api.act(api.fresh(lifeS),'wasteNot',lifeS);
 const d0=wn.d; wn=api.act(wn,'basicTouch',lifeS);
 check(wn?.d===d0-5&&wn.b.wn===3,'Waste Not halves durability and ticks one step');
 let man=api.act(api.fresh(lifeS),'manipulation',lifeS);
 const manStart=man.d; man=api.act(man,'observe',lifeS);
 check(man?.d===Math.min(lifeS.dur,manStart+5)&&man.b.man===7,'Manipulation heals after the next step, not on activation');
 let gs=api.act(api.fresh(lifeS),'greatStrides',lifeS); gs=api.act(gs,'observe',lifeS); gs=api.act(gs,'basicTouch',lifeS);
 check(gs?.b.gs===0,'Great Strides is consumed by the next quality action');
 let mm=api.act(api.fresh(lifeS),'muscleMemory',lifeS); const beforeMM=mm.p; mm=api.act(mm,'observe',lifeS); mm=api.act(mm,'basicSynthesis',lifeS);
 check(mm?.b.mm===0&&mm.p>beforeMM,'Muscle Memory survives non-synthesis steps and is consumed by synthesis');
 let fa=api.act(api.fresh(lifeS),'finalAppraisal',lifeS);
 check(fa?.step===0&&fa.b.fa===5,'Final Appraisal does not advance step and starts at 5');
 let combo=api.act(api.fresh(lifeS),'basicTouch',lifeS); const cpAfterBasic=combo.cp; combo=api.act(combo,'standardTouch',lifeS);
 check(combo?.cp===cpAfterBasic-18,'Basic Touch -> Standard Touch combo uses 18 CP');
 let adv=api.act(api.fresh(lifeS),'observe',lifeS); const cpAfterObserve=adv.cp; adv=api.act(adv,'advancedTouch',lifeS);
 check(adv?.cp===cpAfterObserve-18,'Observe -> Advanced Touch combo uses 18 CP');

 // Exact real-machine regression reported by user: the old V82 route must no longer be accepted.
 const reportedS={...testS,craft:5778,control:5514,cp:633,dur:60,diff:5940,target:7800,initial:3900,cosmic:true,cosmicAction:'steady'};
 const oldBad=['reflect','wasteNot2','innovation','preparatoryTouch','preparatoryTouch','preparatoryTouch','preparatoryTouch','byregot','veneration','perfectMend','groundwork','contentAction2','rapidSynthesis','rapidSynthesis'];
 const oldBadResult=api.simulate(oldBad,reportedS);
 check(!!oldBadResult&&!api.isGoal(oldBadResult,reportedS)&&oldBadResult.p===5494,'reported V82 Cosmic B macro is correctly rejected at progress 5494/5940');
 // V88: a leading Steady Hand is a normal action and may be pruned when it is unnecessary (Miracle remains pre-applied).
 {const ps={...testS,cosmic:true,cosmicAction:'steady',cosmicSteadyUses:3,diff:100,target:1,initial:1};const pr=api.prune(['contentAction2','basicSynthesis'],ps);check(pr.length===1&&pr[0]==='basicSynthesis','prune can remove unnecessary leading Stellar Steady Hand');}
 // V82 mastery boundaries
 const masteryCases=[
  ['basicSynthesis',30,100],['basicSynthesis',31,120],
  ['rapidSynthesis',62,250],['rapidSynthesis',63,500],
  ['carefulSynthesis',81,150],['carefulSynthesis',82,180],
  ['groundwork',85,300],['groundwork',86,360],
  ['delicateSynthesis',93,100],['delicateSynthesis',94,150]
 ];
 for(const [id,lv,expected] of masteryCases)check(api.progressEfficiency(id,{lv})===expected,`mastery ${id} Lv${lv} = ${expected}%`);
 const faDynamic={...testS,diff:10000,enabledSkills:new Set(testS.enabledSkills)};
 const faState=api.fresh(faDynamic);faState.step=3;faState.p=7500;faState.b.ven=1;faState.b.mm=1;
 check(api.shouldOfferFinalAppraisal(faState,faDynamic),'Final Appraisal offered below 82% when next synthesis can finish');
 const faNotNeeded=api.fresh(faDynamic);faNotNeeded.step=3;faNotNeeded.p=5000;
 check(!api.shouldOfferFinalAppraisal(faNotNeeded,faDynamic),'Final Appraisal omitted when no next synthesis can finish');
 const faList=api.candidates(faState,faDynamic);
 check(faList.filter(id=>id==='finalAppraisal').length===1,'Final Appraisal appears exactly once when needed');
 const gwBase={...testS,lv:100};
 const gwPlain=api.fresh(gwBase);gwPlain.d=15;
 const gwWN=api.fresh(gwBase);gwWN.d=15;gwWN.b.wn=2;
 const gwPerfect=api.fresh(gwBase);gwPerfect.d=5;gwPerfect.b.perfect=true;
 check(api.effectiveProgressEfficiency('groundwork',gwPlain,gwBase)===180,'Groundwork halves at durability 15 without protection');
 check(api.effectiveProgressEfficiency('groundwork',gwWN,gwBase)===360,'Groundwork stays full at durability 15 under Waste Not');
 check(api.effectiveProgressEfficiency('groundwork',gwPerfect,gwBase)===360,'Groundwork stays full when Trained Perfection makes durability cost 0');
 const html=fs.readFileSync(path.join(root,'crafter/macro/index.html'),'utf8');
 for(let lv=51;lv<=99;lv++)check(html.includes(`value=\"${lv}\">Lv${lv}<`),`UI exposes recipe Lv${lv}`);
 const empiricalByLevel={51:[1138,1449],55:[1068,1261],59:[1006,1160],60:[992,1138],61:[858,986],65:[817,870],69:[781,846],70:[772,823],71:[688,716],75:[662,684],79:[638,654],80:[632,648],81:[574,560],85:[556,541],89:[538,523],90:[535,514],91:[487,483],92:[476,472],93:[466,462],94:[458,452],95:[448,443],96:[440,434],97:[432,426],98:[424,418],99:[416,410]};
 for(const [lvText,expected] of Object.entries(empiricalByLevel)){
  const lv=Number(lvText),profile=api.resolveRecipeProfile(String(lv),{}),s={...profile,effectiveLevel:playerEffective(100),lv:100,craft:5778,control:5517,cp:633,dur:80,diff:999999,target:999999,initial:0,safeOnly:true,cosmicAction:'none',enabledSkills:new Set(Object.keys(api.A).filter(id=>id!=='contentAction2'))};
  const b=api.bases(s),work=Math.floor(b.p*api.progressEfficiency('basicSynthesis',s)/100);
  check(work===expected[0]&&b.q===expected[1],`empirical Lv${lv}: Basic Synthesis ${work}, Basic Touch ${b.q}`);
 }
 // Verify Mastery actually changes simulated progress, not just the helper table.
 const masteryBase={effectiveLevel:1,rlvl:999,pd:50,pm:100,qd:30,qm:100,craft:490,control:100,cp:999,dur:80,diff:999999,target:999999,initial:0,safeOnly:false,cosmicAction:'none',enabledSkills:new Set(Object.keys(api.A).filter(id=>id!=='contentAction2'))};
 const actualMastery=[['basicSynthesis',30,100],['basicSynthesis',31,120],['rapidSynthesis',62,250],['rapidSynthesis',63,500],['carefulSynthesis',81,150],['carefulSynthesis',82,180],['groundwork',85,300],['groundwork',86,360],['delicateSynthesis',93,100],['delicateSynthesis',94,150]];
 for(const [id,lv,expected] of actualMastery){const s={...masteryBase,lv},x=api.act(api.fresh(s),id,s);check(!!x&&x.p===expected,`act mastery ${id} Lv${lv}: progress ${x?.p} = ${expected}`)}
 // Macro line packing: no macro may exceed 15 lines.
 for(const n of [1,14,15,16,28,29,30]){const ids=Array(n).fill('basicSynthesis'),parts=api.format(ids);check(parts.every(part=>part.split('\n').length<=15),`format ${n} actions: every macro <= 15 lines`)}
 for(const t of data.formulaChecks||[]){const {profile,s}=makeState(t);check(!profile.resolutionError,`${t.id}: profile resolves`);if(!s)continue;const b=api.bases(s),basicSynthesis=Math.floor(b.p*1.2),basicTouch=b.q;check(basicSynthesis===t.expected.basicSynthesis&&basicTouch===t.expected.basicTouch,`${t.id}: Basic Synthesis ${basicSynthesis}, Basic Touch ${basicTouch}`)}
 for(const t of data.rejectionChecks||[]){const {profile}=makeState(t);check(!!profile.resolutionError,`${t.id}: unsupported recipe rejected`)}
 for(const t of data.searchChecks||[]){const {profile,s}=makeState(t);check(!profile.resolutionError,`${t.id}: profile resolves`);if(!s)continue;const x=await api.search(s,{beamWidth:t.beamWidth||5000,timeLimit:t.timeLimit||15000,maxDepth:30});check(!!x&&api.isGoal(x,s),`${t.id}: completes and reaches max quality`);if(x&&t.expected?.maxActions)check(x.log.length<=t.expected.maxActions,`${t.id}: actions ${x.log.length} <= ${t.expected.maxActions}`)}
 console.log(failed?`\n${failed} regression check(s) failed.`:'\nAll regression checks passed.');
 process.exitCode=failed?1:0;
})().catch(e=>{console.error(e);process.exitCode=1});
