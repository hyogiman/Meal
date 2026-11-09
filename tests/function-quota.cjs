'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
let requests=[],transactions=0,incomplete=false,malform=null;
const db={collection:()=>({limit:()=>({get:async()=>({docs:[]})})}),doc:()=>({get:async()=>({data:()=>({budget:80000})})}),runTransaction:()=>{transactions++;throw Error('No quota writes expected');}};
class HttpsError extends Error{constructor(code,message){super(message);this.code=code;}}
const groups=['돼지고기','닭고기','생선','해산물','두부·콩'];
const ingredients=['돼지고기','닭고기','고등어','새우','두부'];
const recipe=i=>({title:'메뉴 '+i,mainIngredient:ingredients[i%5],mainCategory:groups[i%5],cookingMethod:['구이','볶음','조림','찜'][i%4],courses:[{title:'요리 '+i,role:'main',minutes:20,requiresRice:true,ingredients:[{name:ingredients[i%5],qty:300,unit:'g'}],seasonings:[{name:'고춧가루',qty:6,unit:'g'},{name:'진간장',qty:15,unit:'ml'}],steps:['재료를 준비한다.','양념을 섞는다.','충분히 익힌다.','나눈다.']}]});
class OpenAI{constructor(){this.responses={create:async request=>{requests.push(request);let output=request.text.format.name==='meal_weekly_plan'?{recipes:Array.from({length:14},(_,i)=>recipe(i)),days:Array.from({length:7},(_,i)=>({breakfast:i%4,lunch:4+(i*2)%10,dinner:4+(i*2+1)%10}))}:{meals:Array.from({length:3},(_,i)=>recipe(i))};if(malform)malform(output);return {status:incomplete?'incomplete':'completed',output_text:JSON.stringify(output)};}};}}
const context=vm.createContext({exports:{},console,Date,require:name=>{
 if(name==='firebase-functions/v2/https')return {onCall:(_options,handler)=>handler,HttpsError};
 if(name==='firebase-functions/params')return {defineSecret:name=>({value:()=>name==='MEAL_ALLOWED_UIDS'?'test-family':'test-key'})};
 if(name==='firebase-admin')return {initializeApp:()=>{},firestore:()=>db};
 if(name==='openai')return OpenAI;throw Error(name);
}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../functions/index.js'),'utf8'),context);
(async()=>{
 const request={auth:{uid:'test-family'},data:{mode:'single',date:'2026-11-04',slot:'저녁',servings:2}};
 for(let i=0;i<3;i++)assert.equal((await context.exports.suggestMeals(request)).meals.length,3);
 assert.equal(transactions,0);assert.equal(requests.length,3);assert.equal(requests[0].max_output_tokens,5000);
 assert.equal(requests[0].text.format.schema.properties.meals.maxItems,3);
 const itemSchema=requests[0].text.format.schema.properties.meals.items.properties.courses.items.properties.seasonings.items;
 assert.deepEqual(Array.from(itemSchema.properties.unit.enum),['g','kg','ml','L','개']);assert(itemSchema.properties.qty.minimum>0);
 for(const data of [{startDate:'2026-11-04',servings:2},{...request.data,date:'2026-02-30'},{...request.data,slot:'간식'},{...request.data,servings:0}]){
  await assert.rejects(context.exports.suggestMeals({...request,data}),e=>['invalid-argument','failed-precondition'].includes(e.code));
 }
 await assert.rejects(context.exports.suggestMeals({data:request.data}),e=>e.code==='unauthenticated');
 await assert.rejects(context.exports.suggestMeals({...request,auth:{uid:'outsider'}}),e=>e.code==='permission-denied');
 await assert.rejects(context.exports.analyzeInventoryPhoto(request),e=>e.code==='failed-precondition');
 assert.equal(requests.length,3,'Rejected weekly/photo requests must not reach OpenAI');
 const weeklyRequest={...request,data:{mode:'weekly',startDate:'2026-12-28',servings:3,avoidTitles:['이전 메뉴']}};
 const week=await context.exports.suggestMeals(weeklyRequest);assert.equal(week.days.length,7);assert.equal(week.days[6].date,'2027-01-03');
 assert.equal(week.days.flatMap(d=>d.meals).length,21);assert.equal(new Set(week.days.flatMap(d=>d.meals.map(m=>m.title))).size,14);
 for(const day of week.days)assert.deepEqual(Array.from(day.meals,m=>m.slot),['아침','점심','저녁']);
 assert.equal(week.days[0].meals[0].courses[0].seasonings[0].qty,6,'Required seasoning quantities must reach client');
 assert.equal(requests.at(-1).max_output_tokens,14000);assert.deepEqual(JSON.parse(requests.at(-1).input[0].content).avoidTitles,['이전 메뉴']);
 for(const invalid of [out=>out.days.pop(),out=>out.days[0].breakfast=14,out=>out.days[0].lunch=out.days[0].breakfast,out=>out.recipes[1].title=out.recipes[0].title,out=>out.recipes[0].courses[0].seasonings[0].unit='작은술',out=>out.recipes[0].courses[0].seasonings[0].qty=0]){
  malform=invalid;await assert.rejects(context.exports.suggestMeals(weeklyRequest),e=>e.code==='internal');
 }
 malform=null;incomplete=true;await assert.rejects(context.exports.suggestMeals(request),e=>e.code==='internal');await assert.rejects(context.exports.suggestMeals(weeklyRequest),e=>e.code==='internal');
 incomplete=false;
 assert.equal(week.weeklyBudget,80000);assert.equal(Object.keys(week.variety.mainGroups).length,5);
 for(const invalid of [out=>out.recipes.forEach(m=>m.mainCategory='달걀'),out=>out.recipes.forEach(m=>m.cookingMethod='볶음'),out=>out.recipes[0].mainIngredient='없는재료']){
  malform=invalid;await assert.rejects(context.exports.suggestMeals(weeklyRequest),e=>e.code==='internal');
 }
 assert.equal(transactions,0);
 console.log('PASS: single and weekly AI schemas, 7 dates/21 slots across year boundary, 14 varied recipes, seasoning quantities, unlimited requests, auth/input guards, malformed/repetitive/incomplete rejection, photo retirement; no network/writes.');
})().catch(e=>{console.error(e);process.exitCode=1;});
