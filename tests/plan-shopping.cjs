'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const script=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(s=>s.includes('function aiMealPlan'));
const elements=new Map();let boxes=[];
function el(id){if(!elements.has(id)){const handlers={};elements.set(id,{value:'',checked:false,disabled:false,hidden:false,textContent:'',innerHTML:'',open:false,addEventListener:(name,fn)=>{handlers[name]=fn;},showModal(){this.open=true;},close(){this.open=false;handlers.close?.();}});}return elements.get(id);}
const context=vm.createContext({console,structuredClone,Date,Intl,crypto:require('node:crypto').webcrypto,document:{querySelector:el,querySelectorAll:s=>s.includes('shoppingSelectItems')?boxes.filter(x=>!x.disabled&&(!s.includes(':checked')||x.checked)):[]},localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>0,clearTimeout(){},window:{scrollTo(){}}});
vm.runInContext(script.replace('initStatic();attachHandlers();renderAll();initFirebase();','')+'\nglobalThis.api={state,weekFingerprint,normalizeMealOption,mergeMealIntoPlan,showWeekPreview,saveWeekPlan,reviewWeekConflict,shoppingChoices,openShoppingSelection,shoppingSelectionChanged,selectAllShopping,saveShoppingSelection,attachHandlers};',context);
const a=context.api;
const reorder=x=>Array.isArray(x)?x.map(reorder):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).reverse().map(k=>[k,reorder(x[k])])):x;
const meal=a.normalizeMealOption({title:'새우 요리',courses:[{title:'새우 요리',role:'main',minutes:20,requiresRice:false,ingredients:[{name:'새우',qty:600,unit:'g'}],seasonings:[{name:'간장',qty:20,unit:'ml'}],steps:['익힌다.']}]},2);
const plan=a.mergeMealIntoPlan(null,{date:'2026-11-09',slot:'저녁',startDate:'2026-11-09',maxMinutes:35},meal,[]);
assert.equal(a.weekFingerprint(plan),a.weekFingerprint(reorder(plan)),'Same document content with reordered nested keys must not trigger a conflict');
(async()=>{
 let stored=reorder(plan),planWrites=0,wishWrites=[],failBatch=false;
 context.fakeFb={firestore:{doc:(_db,...parts)=>({collection:parts[2],id:parts[3]}),runTransaction:async(_db,fn)=>fn({get:async()=>({exists:()=>!!stored,data:()=>structuredClone(stored)}),set:(ref,value)=>{assert.equal(ref.collection,'plans');stored=structuredClone(value);planWrites++;}}),writeBatch:()=>{const writes=[];return {set:(ref,value)=>{assert.equal(ref.collection,'wishlist');writes.push(value);},commit:async()=>{if(failBatch)throw Error('batch failed');wishWrites.push(...writes);}};}}};
 vm.runInContext("fb=fakeFb;db={};state.mode='cloud';state.user={uid:'owner'};renderAll=()=>{};",context);a.attachHandlers();
 a.showWeekPreview(structuredClone(plan),a.weekFingerprint(plan));el('#replaceWeekCheck').checked=true;el('#saveWeekPlan').disabled=false;
 await a.saveWeekPlan();assert.equal(planWrites,1,'Reordered Firestore document must save successfully');
 const changed=structuredClone(stored);a.showWeekPreview(structuredClone(plan),a.weekFingerprint(stored));changed.days[0].meals[0].title='다른 기기 수정';stored=changed;
 el('#replaceWeekCheck').checked=true;el('#saveWeekPlan').disabled=false;await a.saveWeekPlan();assert.equal(planWrites,1);assert.equal(el('#weekConflictPanel').hidden,false);assert.match(el('#weekConflictContent').innerHTML,/다른 기기 수정/);
 a.reviewWeekConflict();assert.equal(el('#saveWeekPlan').disabled,true);await a.saveWeekPlan();assert.equal(planWrites,1);
 el('#replaceWeekCheck').checked=true;el('#saveWeekPlan').disabled=false;await a.saveWeekPlan();assert.equal(planWrites,2,'Original draft saves after explicit review, with no AI call');assert.equal(stored.days[0].meals[0].title,meal.title);
 // A second change after reviewing still blocks a write.
 a.showWeekPreview(plan,a.weekFingerprint(stored));stored.days[0].meals[0].title='두 번째 변경';el('#replaceWeekCheck').checked=true;el('#saveWeekPlan').disabled=false;await a.saveWeekPlan();a.reviewWeekConflict();stored.days[0].meals[0].title='세 번째 변경';el('#replaceWeekCheck').checked=true;el('#saveWeekPlan').disabled=false;await a.saveWeekPlan();assert.equal(planWrites,2);
 a.state.inventory=[{name:'새우',qty:.2,unit:'kg'}];a.state.wishlist=[{id:'existing',name:'간장',qty:20,unit:'ml'}];const stockBefore=JSON.stringify(a.state.inventory),planBefore=JSON.stringify(stored);
 const choices=a.shoppingChoices(plan,a.state.inventory,a.state.wishlist);assert.equal(choices[0].qty,400);assert.equal(choices[1].already,true);
 a.openShoppingSelection(plan);boxes=[{value:'0',checked:false,disabled:false},{value:'1',checked:false,disabled:true}];assert.equal(el('#saveShoppingSelection').disabled,true);await a.saveShoppingSelection();assert.equal(wishWrites.length,0);
 a.selectAllShopping(true);assert.equal(boxes[0].checked,true);assert.equal(boxes[1].checked,false);a.selectAllShopping(false);assert.equal(el('#saveShoppingSelection').disabled,true);
 a.selectAllShopping(true);el('#shoppingSelectDialog').close();await a.saveShoppingSelection();assert.equal(wishWrites.length,0,'Cancel adds nothing');
 a.openShoppingSelection(plan);a.selectAllShopping(true);a.state.user.uid='other';await a.saveShoppingSelection();assert.equal(wishWrites.length,0);a.state.user.uid='owner';
 failBatch=true;await a.saveShoppingSelection();assert.equal(wishWrites.length,0);assert.equal(el('#saveShoppingSelection').disabled,false);
 failBatch=false;a.state.inventory[0].qty=.3;await a.saveShoppingSelection();assert.equal(wishWrites.length,1);assert.equal(wishWrites[0].name,'새우');assert.equal(wishWrites[0].qty,300,'New stock is deducted before submitting checked item');await a.saveShoppingSelection();assert.equal(wishWrites.length,1);
 assert.equal(a.state.wishlist.length,2);assert.equal(JSON.stringify(stored),planBefore);assert.equal(a.state.inventory[0].qty,.3);assert.equal(JSON.parse(stockBefore)[0].qty,.2);
 console.log('PASS: key-order regression; real conflicts and explicit draft retry; selected-only batch, duplicate prevention, cancel, account guard, failure/retry, latest stock deduction; no production writes.');
})().catch(e=>{console.error(e);process.exitCode=1;});
