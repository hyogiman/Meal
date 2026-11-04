'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const script=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(x=>x[1]).find(x=>x.includes('async function aiMealPlan'));
new vm.Script(script);
const source=script.slice(script.indexOf('let pendingAiPlan='),script.indexOf('async function saveSettings'));
const elements=new Map();
const element=id=>{if(!elements.has(id))elements.set(id,{value:'',disabled:false,textContent:'',innerHTML:''});return elements.get(id);};
element('#planDate').value='2026-11-02';element('#planServings').value='2';element('#planTime').value='35';
const course={title:'계란국',role:'soup',minutes:15,ingredients:[{name:'계란',qty:2,unit:'개'}],seasonings:[],steps:['끓인다.']};
const plan={days:Array.from({length:7},()=>({meals:Array.from({length:3},()=>({title:'계란국',courses:[course],missing:[{name:'계란',qty:2,unit:'개'}]}))}))};
let writes=[],calls=0,open=false,saveFailure=false,notices=[];
const context=vm.createContext({
 state:{mode:'cloud',user:{uid:'test-user'}},functions:{},
 fb:{functions:{httpsCallable:()=>async()=>{calls++;return {data:{plan}};}}},
 $:element,notice:x=>notices.push(x),toast:()=>{},confirm:()=>true,
 openModal:()=>{open=true;},closeModal:()=>{open=false;},
 upsert:async(collection,data)=>{if(saveFailure)throw Error('write failed');writes.push({collection,data});},
 esc:x=>String(x),recipeHTML:()=>'<p>recipe</p>',createUID:()=> 'test-id',
 plusDays:(date,i)=>date+'+'+i,normalizedName:x=>String(x).trim(),nutritionEstimate:()=>({kcal:0}),parseAuthError:e=>e.message
});
vm.runInContext(source,context);
(async()=>{
 await context.aiMealPlan();
 assert.equal(calls,1);assert.equal(writes.length,0,'AI response must never write, even if native confirm auto-accepts');assert.equal(open,true);
 assert.equal((element('#aiPlanReviewContent').innerHTML.match(/<details>/g)||[]).length,21);
 context.state.user.uid='another-user';await context.saveReviewedAiPlan();assert.equal(writes.length,0,'Account change must not save another user draft');
 context.state.user.uid='test-user';saveFailure=true;await context.saveReviewedAiPlan();assert.equal(writes.length,0);assert.equal(open,true);assert.equal(element('#saveAiPlan').disabled,false);
 saveFailure=false;await context.saveReviewedAiPlan();assert.equal(writes.length,1);assert.equal(writes[0].collection,'plans');assert.equal(writes[0].data.missing[0].qty,42);assert.equal(open,false);
 await context.saveReviewedAiPlan();assert.equal(writes.length,1,'Cleared draft must not save twice');
 console.log('PASS: preview makes no writes; 21 meals; account guard; failed-save recovery; explicit save; shortage aggregation; duplicate-save guard. No network or production writes.');
})().catch(e=>{console.error(e);process.exitCode=1;});
