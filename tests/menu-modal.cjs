'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),script=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).find(x=>x.includes('function aiMealPlan'));
assert(!/\b(?:confirm|alert|prompt)\s*\(/.test(script),'Native JS dialogs must be absent');
const elements=new Map();function el(id){if(!elements.has(id)){const events={};elements.set(id,{value:'',innerHTML:'',textContent:'',hidden:false,disabled:false,open:false,addEventListener:(e,fn)=>{events[e]=fn;},showModal(){this.open=true;},close(){this.open=false;events.close?.();},classList:{toggle(){}},setAttribute(){}});}return elements.get(id);}
const context=vm.createContext({console,structuredClone,Date,Intl,crypto:require('node:crypto').webcrypto,document:{querySelector:el,querySelectorAll:()=>[]},localStorage:{getItem:()=>null,setItem(){}},setTimeout:()=>0,clearTimeout(){},window:{scrollTo(){}}});
vm.runInContext(script.replace('initStatic();attachHandlers();renderAll();initFirebase();','')+'\nglobalThis.api={state,renderMenuBoard,moveMenuWeek,showBoardMeal,boardCourses,askConfirmation,settleConfirmation,attachHandlers,deleteInventory};',context);
const a=context.api;a.attachHandlers();
(async()=>{
 const main={title:'생선구이',role:'main',requiresRice:true,minutes:20,ingredients:[{name:'고등어',qty:300,unit:'g'}],seasonings:[],steps:['익힌다']},soup={...main,title:'된장찌개',role:'soup'},side={...main,title:'나물',role:'side'};
 const meal={title:'구이 상차림',courses:[main,soup,side],servings:2,minutes:30,slot:'저녁'};
 const plan={id:'2026-11-09',servings:2,days:[{date:'2026-11-09',meals:[meal]}]};a.state.plans=[plan];el('#menuWeek').value=plan.id;el('#planDate').value='2026-12-07';const before=JSON.stringify(a.state);
 a.renderMenuBoard();const board=el('#menuBoard').innerHTML;
 assert.equal((board.match(/<article/g)||[]).length,7);assert.equal((board.match(/class="menu-slot"/g)||[]).length,21);assert.match(board,/된장찌개/);assert.match(board,/국·찌개/);assert.match(board,/나물/);assert.match(board,/밥 · 김치/);assert.equal(el('#menuWeekCount').textContent,'1 / 21끼 준비');assert.equal(JSON.stringify(a.state),before);
 a.showBoardMeal('2026-11-09','저녁');assert.equal(el('#recipeDialog').open,true);assert.match(el('#recipeTitle').textContent,/구이 상차림/,'Board recipes use board week, not planner week');
 a.moveMenuWeek(7);assert.equal(el('#menuWeek').value,'2026-11-16');assert.equal(el('#menuBoardEmpty').hidden,false);assert.equal((el('#menuBoard').innerHTML.match(/아직 정하지 않았어요/g)||[]).length,21);
 el('#menuWeek').value=plan.id;main.title='<img src=x onerror=bad>';a.renderMenuBoard();assert(!el('#menuBoard').innerHTML.includes('<img'));assert.match(el('#menuBoard').innerHTML,/&lt;img/);
 const cancellation=a.askConfirmation('취소 시험');assert.equal(el('#confirmationDialog').open,true);el('#confirmationDialog').close();assert.equal(await cancellation,false);
 const accepted=a.askConfirmation('승인 시험');a.settleConfirmation(true);assert.equal(await accepted,true);assert.equal(el('#confirmationDialog').open,false);
 const pending=a.askConfirmation('먼저 열린 확인');assert.equal(await a.askConfirmation('겹친 요청'),false);a.settleConfirmation(false);assert.equal(await pending,false);
 a.state.mode='cloud';a.state.user={uid:'a'};const changed=a.askConfirmation('계정 변경');a.state.user.uid='b';a.settleConfirmation(true);assert.equal(await changed,false);
 a.state.inventory=[{id:'sample',name:'시험 재료',qty:1,unit:'개'}];let writes=0;context.captureErase=()=>{writes++;};vm.runInContext('erase=async()=>captureErase();',context);
 const deletion=a.deleteInventory('sample');await Promise.resolve();assert.equal(writes,0,'Deletion must wait for modal approval');a.settleConfirmation(false);await deletion;assert.equal(writes,0);
 const confirmed=a.deleteInventory('sample');a.settleConfirmation(true);await confirmed;assert.equal(writes,1);
 console.log('PASS: 7-day/21-slot menu board, actual courses/rice, empty weeks, independent date navigation, recipe link, escaping, no mutation; modal cancel/approve/close/account and duplicate guards, no native dialogs.');
})().catch(e=>{console.error(e);process.exitCode=1;});
