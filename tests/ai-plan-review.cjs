'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const script=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes('function aiMealPlan'));
new vm.Script(script);
const elements=new Map();
function el(id){if(!elements.has(id)){const handlers={};elements.set(id,{value:'',disabled:false,hidden:false,innerHTML:'',textContent:'',open:false,
 addEventListener:(event,fn)=>{handlers[event]=fn;},showModal(){this.open=true;},close(){this.open=false;handlers.close?.();},focus(){},classList:{toggle(){}},setAttribute(){}});}return elements.get(id);}
const context=vm.createContext({console,structuredClone,Date,Intl,crypto:require('node:crypto').webcrypto,
 document:{querySelector:el,querySelectorAll:()=>[]},localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>0,clearTimeout(){},window:{scrollTo(){}}});
vm.runInContext(script.replace('initStatic();attachHandlers();renderAll();initFirebase();','')+`
globalThis.api={nutritionEstimate,nutritionAlert,normalizeMealOption,mergeMealIntoPlan,recalculatePlan,buildMeal,recipes:RECIPES,ingredientScale,mealReadyCourse,aiMealPlan,saveReviewedAiPlan,selectMealCandidate,attachHandlers,state};
`,context);
const a=context.api;
const raw=(name='달걀',qty=100)=>({title:name+' 요리',courses:[{title:name+' 요리',role:'main',minutes:15,requiresRice:false,ingredients:[{name,qty,unit:'g'}],seasonings:[],steps:['재료를 익힙니다.']}]});
const plain=x=>JSON.parse(JSON.stringify(x));
(async()=>{
 const one=a.buildMeal(a.recipes.find(x=>x.id==='egg_soup'),null,1),four=a.buildMeal(a.recipes.find(x=>x.id==='egg_soup'),null,4);
 assert.deepEqual(plain(a.nutritionEstimate(one)),plain(a.nutritionEstimate(four)),'Per-person nutrition for built-in recipe must not shrink with party size');
 const aiOne=a.normalizeMealOption(raw('달걀',100),1),aiFour=a.normalizeMealOption(raw('달걀',400),4);
 assert.deepEqual(plain(a.nutritionEstimate(aiOne)),plain(a.nutritionEstimate(aiFour)),'AI totals must not be scaled twice');
 assert.equal(a.mealReadyCourse(aiOne),'김치만 별도로 곁들이기');
 const high=a.normalizeMealOption(raw('밥',300),1),low=a.normalizeMealOption(raw('닭고기',200),1),unknown=a.normalizeMealOption(raw('알수없는재료',200),1);
 assert.match(a.nutritionAlert(high.nutrition),/높습니다/);assert.equal(a.nutritionAlert(low.nutrition),'');assert.match(a.nutritionAlert(unknown.nutrition),/보류/);
 const target={date:'2026-11-04',slot:'저녁',startDate:'2026-11-02',maxMinutes:35};
 const first=a.mergeMealIntoPlan(null,target,aiOne,[]);assert.equal(first.days.length,7);assert.equal(first.days.flatMap(x=>x.meals).length,1);
 const existing=a.mergeMealIntoPlan(first,{...target,slot:'아침'},low,[]),before=JSON.stringify(existing);
 const replaced=a.mergeMealIntoPlan(existing,target,high,[]);
 assert.equal(JSON.stringify(existing),before,'Input plan must not mutate');assert.equal(replaced.days[2].meals.length,2);
 assert.deepEqual(plain(replaced.days[2].meals[0]),plain(existing.days[2].meals[0]),'Other slot must stay intact');
 assert.notEqual(replaced.days[2].meals[1].nutrition.carbs,existing.days[2].meals[1].nutrition.carbs);
 const stock=[{name:'밥',qty:10000,unit:'g'},{name:'달걀',qty:1,unit:'kg'}];
 assert.equal(a.recalculatePlan(first,stock).missing.length,0,'Compatible stock units should be consumed');
 let writes=0,apiCalls=0,fail=false;let stored=existing;
 context.fakeFb={functions:{httpsCallable:()=>async payload=>{assert.equal(payload.mode,'single');apiCalls++;return {data:{meals:[raw(),raw('밥',300),raw('닭고기',200)]}};}},
 firestore:{doc:()=>({}),runTransaction:async(_db,fn)=>fn({get:async()=>({exists:()=>true,data:()=>stored}),set:(_ref,value)=>{if(fail)throw Error('write failed');writes++;stored=value;}})}};
 vm.runInContext("fb=fakeFb;functions={};db={};state.mode='cloud';state.user={uid:'test-user'};renderAll=()=>{};",context);
 el('#mealDate').value='2026-11-04';el('#mealSlot').value='저녁';el('#planDate').value='2026-11-02';el('#planServings').value='2';el('#planTime').value='35';
 a.attachHandlers();
 await a.aiMealPlan();assert.equal(apiCalls,1);assert.equal(writes,0);assert.equal(el('#aiPlanReviewDialog').open,true);assert.equal(el('#saveAiPlan').disabled,true);
 assert.equal((el('#aiPlanReviewContent').innerHTML.match(/name="mealChoice"/g)||[]).length,3);
 a.selectMealCandidate(1);assert.match(el('#selectedMealNutrition').innerHTML,/높습니다/);
 el('#aiPlanReviewDialog').close();await a.saveReviewedAiPlan();assert.equal(writes,0,'Close must discard draft');
 await a.aiMealPlan();a.selectMealCandidate(2);a.state.user.uid='other';await a.saveReviewedAiPlan();assert.equal(writes,0);
 a.state.user.uid='test-user';fail=true;await a.saveReviewedAiPlan();assert.equal(writes,0);assert.equal(el('#saveAiPlan').disabled,false);
 fail=false;await a.saveReviewedAiPlan();assert.equal(writes,1);assert.equal(stored.days[2].meals[0].title,existing.days[2].meals[0].title);
 assert.equal(stored.days[2].meals[1].title,'닭고기 요리');await a.saveReviewedAiPlan();assert.equal(writes,1);
 assert(!html.includes('id="analyzePhotosBtn"'));assert(!html.includes('id="invPhoto"'));assert(!html.includes('firebase-storage.js'));
 console.log('PASS: serving scales, nutrition alerts/unknowns, 7-day sparse plan, single-slot merge, kg/g shortage, three previews/no writes, cancel, account guard, failed save, explicit transaction and photo removal. No network or production writes.');
})().catch(e=>{console.error(e);process.exitCode=1;});
