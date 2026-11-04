'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const usage={planCalls:2,photoCalls:5};let aiCalls=0,usageWrites=0;
const db={
 collection:()=>({limit:()=>({get:async()=>({docs:[]})})}),
 doc:()=>({get:async()=>({data:()=>({budget:80000})})}),
 runTransaction:async fn=>fn({get:async()=>({data:()=>usage}),set:()=>{usageWrites++;}})
};
class HttpsError extends Error{constructor(code,message){super(message);this.code=code;}}
class OpenAI{constructor(){this.responses={create:async()=>{aiCalls++;return {output_text:JSON.stringify({days:Array.from({length:7},()=>({meals:[{},{},{}]}))})};}};}}
const context=vm.createContext({exports:{},console,Intl,Date,require:name=>{
 if(name==='firebase-functions/v2/https')return {onCall:(_options,handler)=>handler,HttpsError};
 if(name==='firebase-functions/params')return {defineSecret:name=>({value:()=>name==='MEAL_ALLOWED_UIDS'?'test-family':'test-key'})};
 if(name==='firebase-admin')return {initializeApp:()=>{},firestore:()=>db};
 if(name==='openai')return OpenAI;
 throw Error('Unexpected dependency: '+name);
}});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../functions/index.js'),'utf8'),context);
(async()=>{
 const req={auth:{uid:'test-family'},data:{startDate:'2026-11-04',servings:2}};
 for(let i=0;i<3;i++)assert.equal((await context.exports.suggestMeals(req)).plan.days.length,7);
 assert.equal(aiCalls,3);assert.equal(usageWrites,0);assert.equal(usage.planCalls,2);
 await assert.rejects(context.exports.suggestMeals({data:req.data}),e=>e.code==='unauthenticated');
 await assert.rejects(context.exports.suggestMeals({...req,auth:{uid:'outsider'}}),e=>e.code==='permission-denied');
 await assert.rejects(context.exports.analyzeInventoryPhoto({auth:req.auth,data:{images:['data:image/jpeg;base64,YQ==']}}),e=>e.code==='resource-exhausted');
 assert.equal(aiCalls,3);
 console.log('PASS: meal calls succeed beyond the former daily quota without quota writes; authentication, family allowlist and photo limit remain. No network or production writes.');
})().catch(e=>{console.error(e);process.exitCode=1;});
