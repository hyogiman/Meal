'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
let requests=[],transactions=0,incomplete=false;
const db={collection:()=>({limit:()=>({get:async()=>({docs:[]})})}),doc:()=>({get:async()=>({data:()=>({budget:80000})})}),runTransaction:()=>{transactions++;throw Error('No quota writes expected');}};
class HttpsError extends Error{constructor(code,message){super(message);this.code=code;}}
class OpenAI{constructor(){this.responses={create:async request=>{requests.push(request);return {status:incomplete?'incomplete':'completed',output_text:JSON.stringify({meals:Array.from({length:3},()=>({title:'test',courses:[{}]}))})};}};}}
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
 for(const data of [{startDate:'2026-11-04',servings:2},{...request.data,date:'2026-02-30'},{...request.data,slot:'간식'},{...request.data,servings:0}]){
  await assert.rejects(context.exports.suggestMeals({...request,data}),e=>['invalid-argument','failed-precondition'].includes(e.code));
 }
 await assert.rejects(context.exports.suggestMeals({data:request.data}),e=>e.code==='unauthenticated');
 await assert.rejects(context.exports.suggestMeals({...request,auth:{uid:'outsider'}}),e=>e.code==='permission-denied');
 await assert.rejects(context.exports.analyzeInventoryPhoto(request),e=>e.code==='failed-precondition');
 assert.equal(requests.length,3,'Rejected weekly/photo requests must not reach OpenAI');
 incomplete=true;await assert.rejects(context.exports.suggestMeals(request),e=>e.code==='internal');
 console.log('PASS: single-meal schema/budget, unlimited requests, auth, input dates, legacy weekly and photo rejection, incomplete-response handling; no network/writes.');
})().catch(e=>{console.error(e);process.exitCode=1;});
