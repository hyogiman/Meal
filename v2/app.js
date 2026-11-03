
import {initializeApp} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import {getAuth,GoogleAuthProvider,signInWithPopup,onAuthStateChanged,signOut} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import {getFirestore,collection,doc,onSnapshot,setDoc,deleteDoc,writeBatch} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";
import {FOODS,FOOD_BY_ID,DISHES,STARTER_STOCK,COUPANG_CART,generatePlan,weekMonday,shiftDate,stockIndex} from "./recipes.js";
const cfg={apiKey:"AIzaSyAuWbwrfe0_-RwYHgkLws5Ey9fAz5xfCkI",authDomain:"mealplan-786a6.firebaseapp.com",projectId:"mealplan-786a6",storageBucket:"mealplan-786a6.firebasestorage.app",messagingSenderId:"555913915058",appId:"1:555913915058:web:a7b0ef8d379e88fad8f7ab"};
const app=initializeApp(cfg),auth=getAuth(app),db=getFirestore(app),LSKEY="meal_v2_local_v1";
const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s)),fmt=n=>Math.round(Number(n)||0).toLocaleString("ko-KR")+"원";
const xss=t=>String(t??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const newId=()=>globalThis.crypto?.randomUUID?.()||String(Date.now())+"-"+Math.random().toString(36).slice(2);
const today=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const empty=()=>({inventory:[],cart:[],purchases:[],plans:{},settings:{budget:80000}});
const unitNormalize=(q,u)=>{const n=q===""||q==null?null:Number(q);if(n!==null&&(!Number.isFinite(n)||n<0))throw Error("수량이 올바르지 않습니다.");return {quantity:n===null?null:(u==="kg"||u==="L"?n*1000:n),unit:u==="kg"?"g":u==="L"?"ml":u};};
function localRead(){try{const x=JSON.parse(localStorage.getItem(LSKEY)||"null");return x&&Array.isArray(x.inventory)&&Array.isArray(x.cart)&&Array.isArray(x.purchases)?{...empty(),...x}:empty();}catch(e){return empty();}}
let state=localRead(),mode="local",user=null,unsubs=[],editing=null,loading=false,draft=null,replaceAt=null,active="home";
let planWeek=weekMonday(today());if([0,6].includes(new Date().getDay()))planWeek=shiftDate(planWeek,7);
const dbRef=(table,id)=>doc(db,"users",user.uid,table,id);
const notify=(msg,error=false)=>{$("#statusText").textContent=msg;$("#statusDot").className="dot "+(error?"err":mode==="cloud"?"ok":"");};
function localWrite(){try{localStorage.setItem(LSKEY,JSON.stringify(state));}catch(e){notify("브라우저 저장 공간이 부족하거나 저장이 차단되었습니다.",true);throw e;}}
async function put(table,row){if(mode==="cloud")await setDoc(dbRef(table,row.id),row);else{const arr=state[table];const i=arr.findIndex(x=>x.id===row.id);if(i<0)arr.push(row);else arr[i]=row;localWrite();}render();}
async function del(table,id){if(mode==="cloud")await deleteDoc(dbRef(table,id));else{state[table]=state[table].filter(x=>x.id!==id);localWrite();}render();}
async function putBatch(table,items){if(!items.length)return;if(mode==="cloud"){for(let i=0;i<items.length;i+=300){const b=writeBatch(db);items.slice(i,i+300).forEach(x=>b.set(dbRef(table,x.id),x));await b.commit();}}else{state[table].push(...items);localWrite();}render();}
const foodName=id=>FOOD_BY_ID[id]?.name||id,quantityText=x=>x.quantity==null?"수량 미확인":x.quantity+" "+x.unit;
function group(rows,key){return rows.reduce((a,r)=>{(a[r[key]||"기타"]??=[]).push(r);return a;},{});}
function setupOptions(){const choices='<option value="">식재료를 선택하세요</option>'+FOODS.map(x=>'<option value="'+xss(x.id)+'">'+xss(x.name)+'</option>').join("");["#invKey","#cartKey","#purchaseKey"].forEach(k=>$(k).innerHTML=choices);}
setupOptions();$("#invDate").value=$("#purchaseDate").value=today();
function setDefaultUnit(key,id){const food=FOOD_BY_ID[key];if(food)$(id).value=food.unit;}
[["#invKey","#invUnit"],["#cartKey","#cartUnit"],["#purchaseKey","#purchaseUnit"]].forEach(([key,unit])=>$(key).addEventListener("change",e=>setDefaultUnit(e.target.value,unit)));
function tab(name){active=name;$$(".nav button[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));$$(".panel").forEach(p=>p.classList.toggle("active",p.id==="panel-"+name));render();window.scrollTo(0,0);}
$$(".nav button[data-tab]").forEach(b=>b.addEventListener("click",()=>tab(b.dataset.tab)));
$$("[data-goto]").forEach(b=>b.addEventListener("click",()=>tab(b.dataset.goto)));
function resetInventoryForm(){editing=null;$("#inventoryForm").reset();$("#invDate").value=today();$("#inventoryFormTitle").textContent="+ 식재료 상세 등록";$("#invSubmit").textContent="냉장고에 저장";$("#invCancel").hidden=true;}
$("#invCancel").addEventListener("click",resetInventoryForm);
$("#inventoryForm").addEventListener("submit",async e=>{
 e.preventDefault();if(loading)return;
 try{
  const old=state.inventory.find(x=>x.id===editing);
  const norm=unitNormalize($("#invQuantity").value,$("#invUnit").value);
  const r={id:editing||newId(),key:$("#invKey").value,label:$("#invLabel").value.trim().slice(0,80),...norm,place:$("#invPlace").value,acquired:$("#invDate").value,expiry:$("#invExpiry").value,opened:$("#invOpened").value==="true",note:$("#invNote").value.trim().slice(0,240),origin:old?.origin||"직접 등록",sourcePurchaseId:old?.sourcePurchaseId||"",createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};
  if(!FOOD_BY_ID[r.key]||!r.unit)throw Error("식재료 종류와 단위를 확인해 주세요.");
  loading=true;await put("inventory",r);resetInventoryForm();$("#invFormMessage").textContent="재고를 저장했습니다.";
 }catch(err){$("#invFormMessage").textContent="저장 실패: "+err.message;}finally{loading=false;}
});
$("#seedStock").addEventListener("click",async()=>{
 const used=new Set(state.inventory.map(x=>x.key));
 const list=STARTER_STOCK.filter(x=>!used.has(x.key)).map(x=>({id:newId(),...x,label:"",acquired:"",expiry:"",opened:false,origin:"직접 알려준 기존 보유 재료",sourcePurchaseId:"",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}));
 if(!list.length){$("#invFormMessage").textContent="동일한 품목이 이미 등록되어 있습니다.";return;}
 if(!confirm("확인했던 식재료 "+list.length+"종을 가져올까요? 양이 모호한 것은 수량 미확인으로 저장합니다."))return;
 try{await putBatch("inventory",list);$("#invFormMessage").textContent=list.length+"종을 불러왔습니다. 실제 재고량과 소비기한을 확인해 주세요.";}catch(err){$("#invFormMessage").textContent="불러오기 실패: "+err.message;}
});
$("#invSearch").addEventListener("input",renderInventory);$("#invFilter").addEventListener("change",renderInventory);
function renderInventory(){
 const q=$("#invSearch").value.toLowerCase(),where=$("#invFilter").value;
 const list=state.inventory.filter(r=>(where==="all"||r.place===where)&&(foodName(r.key).toLowerCase().includes(q)||(r.label||"").toLowerCase().includes(q)));
 if(!list.length){$("#inventoryList").innerHTML='<div class="empty">등록된 재고가 없습니다. 수량이 모르는 식재료는 비워두고 저장할 수 있습니다.</div>';return;}
 const groups=group(list,"place");
 $("#inventoryList").innerHTML=["냉장","냉동","실온"].filter(k=>groups[k]).map(k=>{
  const items=groups[k].slice().sort((a,b)=>(a.expiry||"9999").localeCompare(b.expiry||"9999")).map(r=>{
   const near=r.expiry&&r.expiry<=shiftDate(today(),3);
   return '<div class="item"><div class="item-main"><strong>'+xss(r.label||foodName(r.key))+'</strong> <span class="label">'+xss(quantityText(r))+'</span><p>'+xss(r.place)+' · '+(r.expiry?'소비기한 '+xss(r.expiry):'소비기한 미확인')+(r.opened?' · 개봉 중':'')+'</p>'+(r.note?'<p>'+xss(r.note)+'</p>':'')+(near?'<span class="item-warning">⚠️ 소비기한 확인 필요</span>':'')+'</div><div class="item-controls"><button class="btn sm" data-edit="'+xss(r.id)+'">수정</button><button class="btn sm" data-use="'+xss(r.id)+'">사용</button><button class="btn sm danger" data-delete="'+xss(r.id)+'">삭제</button></div></div>';
  }).join("");
  return '<div class="group-head">'+xss(k)+' <small>'+groups[k].length+'개 묶음</small></div>'+items;
 }).join("");
}
$("#inventoryList").addEventListener("click",async e=>{
 const b=e.target.closest("button");if(!b)return;const id=b.dataset.edit||b.dataset.use||b.dataset.delete;
 const r=state.inventory.find(x=>x.id===id);if(!r)return;
 if(b.hasAttribute("data-edit")){
  editing=id;$("#invKey").value=r.key;$("#invLabel").value=r.label||"";$("#invQuantity").value=r.quantity??"";$("#invUnit").value=r.unit;$("#invPlace").value=r.place;$("#invDate").value=r.acquired||"";$("#invExpiry").value=r.expiry||"";$("#invOpened").value=String(!!r.opened);$("#invNote").value=r.note||"";$("#inventoryFormTitle").textContent="식재료 수정";$("#invSubmit").textContent="변경사항 저장";$("#invCancel").hidden=false;$("#inventoryForm").scrollIntoView({behavior:"smooth"});return;
 }
 try{
  if(b.hasAttribute("data-delete")){if(confirm("이 재고를 삭제하시겠습니까? 지출 기록은 남습니다."))await del("inventory",id);return;}
  if(r.quantity==null){alert("수량이 미확인입니다. 먼저 남은 수량을 확인·수정해 주세요.");return;}
  const a=prompt("실제 사용한 "+r.unit+" 수량을 입력하세요. 현재 "+quantityText(r));if(a===null)return;
  const n=Number(a);if(!Number.isFinite(n)||n<=0||n>r.quantity){alert("현재 보유 수량 이하의 양수를 입력해 주세요.");return;}
  await put("inventory",{...r,quantity:Math.round((r.quantity-n)*100)/100,updatedAt:new Date().toISOString()});
 }catch(err){notify("재고 변경 실패: "+err.message,true);}
});
$("#cartForm").addEventListener("submit",async e=>{
 e.preventDefault();
 try{
  const norm=unitNormalize($("#cartQuantity").value,$("#cartUnit").value),price=Number($("#cartPrice").value);
  if(!FOOD_BY_ID[$("#cartKey").value]||!$("#cartName").value.trim()||norm.quantity<=0||!Number.isSafeInteger(price)||price<0)throw Error("상품명·수량·표시가격을 확인해 주세요.");
  await put("cart",{id:newId(),key:$("#cartKey").value,name:$("#cartName").value.trim().slice(0,90),...norm,displayPrice:price,store:$("#cartStore").value.trim().slice(0,60),date:today(),status:"planned",source:"수동 입력"});
  $("#cartForm").reset();$("#cartStore").value="쿠팡 로켓프레시";$("#cartFormMessage").textContent="구매 예정 목록에 저장했습니다. 아직 지출로 집계하지 않습니다.";
 }catch(err){$("#cartFormMessage").textContent=err.message;}
});
$("#seedCart").addEventListener("click",async()=>{
 const sig=new Set(state.cart.map(x=>x.key+":"+x.displayPrice));
 const rows=COUPANG_CART.filter(x=>!sig.has(x.key+":"+x.displayPrice)).map(x=>({...x,id:newId(),store:"쿠팡 로켓프레시",date:"2026-11-01",status:"planned"}));
 if(!rows.length){$("#cartFormMessage").textContent="이미 같은 장바구니 상품들이 있습니다.";return;}
 if(!confirm("쿠팡 선택상품 "+rows.length+"개를 구매 예정으로 가져올까요? 구매 완료 및 지출에는 반영되지 않습니다."))return;
 try{await putBatch("cart",rows);$("#cartFormMessage").textContent=rows.length+"개를 구매 예정으로 가져왔습니다.";}catch(err){$("#cartFormMessage").textContent=err.message;}
});
function weekSpent(w){return state.purchases.filter(x=>weekMonday(x.date)===w).reduce((a,x)=>a+Number(x.paid||0),0);}
function budget(){return Number(state.settings?.budget)||80000;}
function renderCart(){
 const planned=state.cart.filter(x=>x.status==="planned"),spent=weekSpent(weekMonday(today()));
 $("#cartTotal").textContent=fmt(planned.reduce((a,x)=>a+Number(x.displayPrice||0),0));$("#shoppingActual").textContent=fmt(spent);$("#shoppingRemain").textContent=fmt(budget()-spent);
 $("#cartList").innerHTML=planned.length?planned.map(x=>'<div class="item"><div class="item-main"><strong>'+xss(x.name)+'</strong><p>'+xss(quantityText(x))+' · 표시가 '+fmt(x.displayPrice)+' · '+xss(x.store||"구매처 미상")+'</p></div><div class="item-controls"><button class="btn primary sm" data-buy="'+xss(x.id)+'">구매 완료</button><button class="btn danger sm" data-drop="'+xss(x.id)+'">삭제</button></div></div>').join(""):'<div class="empty">구매 예정 상품이 없습니다. 상품명과 표시가격을 먼저 등록하세요.</div>';
}
$("#cartList").addEventListener("click",async e=>{
 const b=e.target.closest("button");if(!b)return;
 const id=b.dataset.buy||b.dataset.drop,r=state.cart.find(x=>x.id===id);if(!r)return;
 if(b.hasAttribute("data-drop")){if(confirm("구매 예정 목록에서 제거할까요?"))await del("cart",id);return;}
 openPurchase(r);
});
$("#manualPurchaseBtn").addEventListener("click",()=>openPurchase(null));
function openPurchase(r){
 $("#purchaseForm").reset();$("#purchaseCard").hidden=false;
 $("#purchaseHeading").textContent=r?"구매 확인: "+r.name:"새로 산 물건 직접 기록";
 $("#purchaseCartId").value=r?.id||"";$("#purchaseKey").value=r?.key||"";$("#purchaseName").value=r?.name||"";$("#purchaseQty").value=r?.quantity??"";$("#purchaseUnit").value=r?.unit||"g";$("#purchasePaid").value="";$("#purchasePaid").placeholder=r?"표시가 "+fmt(r.displayPrice)+" · 실제 결제금액 입력":"실제 결제금액 직접 입력";$("#purchaseDate").value=today();$("#purchaseStore").value=r?.store||"";$("#purchasePlace").value=["chicken","pork","mackerel","tofu","milk","sprouts","egg"].includes(r?.key)?"냉장":"실온";
 $("#purchaseCard").scrollIntoView({behavior:"smooth"});
}
$("#purchaseCancel").addEventListener("click",()=>{$("#purchaseCard").hidden=true;});
$("#purchaseForm").addEventListener("submit",async e=>{
 e.preventDefault();if(loading)return;
 try{
  const norm=unitNormalize($("#purchaseQty").value,$("#purchaseUnit").value),paid=Number($("#purchasePaid").value),key=$("#purchaseKey").value,cartId=$("#purchaseCartId").value,name=$("#purchaseName").value.trim().slice(0,90),date=$("#purchaseDate").value;
  if(!FOOD_BY_ID[key]||!name||norm.quantity===null||norm.quantity<=0||!Number.isSafeInteger(paid)||paid<0||!date)throw Error("구매 품목·수량·결제금액·날짜를 확인해 주세요.");
  if(cartId&&!state.cart.some(x=>x.id===cartId))throw Error("이미 구매한 상품이거나 목록에서 삭제되었습니다.");
  const purchaseId=newId(),lotId=newId(),now=new Date().toISOString();
  const expense={id:purchaseId,key,name,...norm,paid,date,store:$("#purchaseStore").value.trim().slice(0,60),cartId,inventoryId:lotId,createdAt:now};
  const lot={id:lotId,key,label:name,...norm,place:$("#purchasePlace").value,acquired:date,expiry:$("#purchaseExpiry").value,opened:$("#purchaseOpened").value==="true",note:"구매 후 등록",origin:"구매 완료",sourcePurchaseId:purchaseId,createdAt:now,updatedAt:now};
  loading=true;$("#purchaseForm button[type=submit]").disabled=true;
  if(mode==="cloud"){
   const batch=writeBatch(db);batch.set(dbRef("purchases",expense.id),expense);batch.set(dbRef("inventory",lot.id),lot);
   if(cartId)batch.delete(dbRef("cart",cartId));await batch.commit();
  }else{
   state.purchases.push(expense);state.inventory.push(lot);if(cartId)state.cart=state.cart.filter(x=>x.id!==cartId);localWrite();
  }
  $("#purchaseCard").hidden=true;notify("실제 "+fmt(paid)+"을 지출에 기록하고 재고에 추가했습니다.");render();
 }catch(err){$("#purchaseMessage").textContent="구매 등록 실패: "+err.message;}finally{loading=false;$("#purchaseForm button[type=submit]").disabled=false;}
});
function renderPurchases(){
 $("#purchasesList").innerHTML=state.purchases.length?state.purchases.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(x=>'<div class="item"><div class="item-main"><strong>'+xss(x.name)+'</strong><p>'+xss(x.date)+' · '+xss(quantityText(x))+' · '+xss(x.store||"")+'</p></div><strong>'+fmt(x.paid)+'</strong></div>').join(""):'<div class="empty">아직 결제 완료로 기록한 내역이 없습니다.</div>';
}
$("#planPrev").addEventListener("click",()=>changeWeek(shiftDate(planWeek,-7)));
$("#planThis").addEventListener("click",()=>changeWeek(weekMonday(today())));
$("#planNext").addEventListener("click",()=>changeWeek(shiftDate(planWeek,7)));
function changeWeek(v){planWeek=v;draft=null;$("#replacementPanel").hidden=true;renderPlanner();}
$("#generatePlan").addEventListener("click",()=>{
 draft=generatePlan({stock:state.inventory,planned:state.cart,includePlanned:$("#includeCart").checked,weekStart:planWeek,maxMinutes:Number($("#planTime").value),basics:{rice:$("#assumeRice").checked,kimchi:$("#assumeKimchi").checked,seasonings:true}});
 $("#planStatus").textContent="식단 초안입니다. 수량 미확인과 부족한 재료를 검토한 뒤 저장해 주세요. 재고는 차감하지 않았습니다.";renderPlanner();
});
$("#planBudget").addEventListener("change",async e=>{const n=Number(e.target.value);if(!Number.isSafeInteger(n)||n<1000||n>10000000){alert("예산은 1,000원 이상 1,000만 원 이하로 입력해 주세요.");e.target.value=budget();return;}try{if(mode==="cloud")await setDoc(dbRef("settings","preferences"),{id:"preferences",budget:n,updatedAt:new Date().toISOString()});else{state.settings.budget=n;localWrite();}render();notify("주간 예산 설정을 저장했습니다.");}catch(err){notify("예산 저장 실패: "+err.message,true);}});
$("#savePlan").addEventListener("click",async()=>{
 if(!draft)return;try{
  const plan={...draft,id:planWeek,weekStart:planWeek,updatedAt:new Date().toISOString()};
  if(mode==="cloud")await setDoc(dbRef("plans",planWeek),plan);else{state.plans[planWeek]=plan;localWrite();}
  draft=plan;$("#planStatus").textContent="식단을 저장했습니다.";renderPlanner();
 }catch(err){$("#planStatus").textContent="식단 저장 실패: "+err.message;}
});
const currentPlan=()=>draft||state.plans[planWeek]||null;
function mealCard(m,di,mi){
 const shortage=(m.missing||[]).map(x=>foodName(x.key)+" "+(x.missing??x.qty)+x.unit).join(", ");
 const unsure=(m.uncertain||[]).map(x=>foodName(x.key)).join(", ");
 const ingredients=(m.ingredients||[]).map(x=>foodName(x.key)+" "+x.qty+x.unit).join(" · ");
 let out='<div class="meal"><small>'+xss(m.slot)+' · 새 조리 '+Number(m.time||0)+'분</small><strong>'+xss(m.title)+'</strong><span class="tag '+(shortage?"need":unsure?"uncertain":"")+'">'+xss(m.status)+'</span>';
 if(shortage)out+='<p class="hint error">부족: '+xss(shortage)+'</p>';
 if(unsure)out+='<p class="hint">수량 확인: '+xss(unsure)+'</p>';
 out+='<details class="recipe-details"><summary style="font-weight:850;cursor:pointer">상차림과 조리법 상세</summary>';
 out+='<div class="setting">밥: '+xss(m.setting?.staple||"밥")+'<br>새로 만드는 요리: <b>'+xss(m.title)+'</b><br>별도로 만드는 국·반찬: <b>없음</b><br>기본 반찬: '+xss(m.setting?.side||"김치")+'</div>';
 out+='<h4>2인분 재료</h4><p>'+xss(ingredients)+'</p><h4>정확한 양념 배합</h4><div class="seasoning">'+xss(m.seasoning||"별도 양념 없음")+'</div>';
 out+='<h4>요리 순서</h4><ol>'+(m.steps||[]).map(x=>'<li>'+xss(x)+'</li>').join("")+'</ol><p>'+xss(m.tips||"")+'</p>';
 out+='<p class="hint">시간은 재료 손질과 양념 만들기를 포함한 조리 추정치입니다. 밥을 새로 짓는 시간과 설거지는 별도입니다.</p></details>';
 out+='<div class="meal-actions"><button type="button" data-replace="'+di+':'+mi+'">이 메뉴 바꾸기</button></div></div>';return out;
}
function renderPlanner(){
 $("#planWeekLabel").textContent=planWeek+" ~ "+shiftDate(planWeek,6);$("#savePlan").disabled=!draft;
 const p=currentPlan();if(!p){$("#planGrid").innerHTML='<div class="empty" style="grid-column:1/-1">냉장고를 등록하고 7일 식단 생성 버튼을 눌러 주세요.</div>';$("#planNeeds").innerHTML="";return;}
 const weekday=["월","화","수","목","금","토","일"];
 $("#planGrid").innerHTML=p.days.map((d,i)=>'<div class="daycol"><div class="daytitle">'+weekday[i]+'요일 <span>'+d.date.slice(5)+'</span></div>'+d.meals.map((m,j)=>mealCard(m,i,j)).join("")+'</div>').join("");
 $("#planNeeds").innerHTML=p.shopping?.length?p.shopping.map(x=>'<span>'+xss(x.name)+" "+xss(x.quantity)+xss(x.unit)+'</span>').join(""):'<span class="chip">확정 부족분 없음 · 수량 미확인 항목은 확인 필요</span>';
}
function estimateMissing(recipe){
 const stock=stockIndex(state.inventory);const missing=[],uncertain=[];
 for(const r of recipe.ingredients){const v=stock[r.key];if(!v)missing.push({...r,missing:r.qty});else if(v.unit!==r.unit||v.unknown&&v.known<r.qty)uncertain.push(r);else if(v.known<r.qty)missing.push({...r,missing:r.qty-v.known});}
 return {missing,uncertain};
}
function toMeal(recipe,slot){
 const {missing,uncertain}=estimateMissing(recipe);
 return {slot,title:recipe.title,recipeId:recipe.id,kind:recipe.kind,time:recipe.time,missing,uncertain,
  status:missing.length?"추가 구매 필요":uncertain.length?"수량 확인 필요":"재고로 가능",ingredients:recipe.ingredients,seasoning:recipe.seasoning,steps:recipe.steps,tips:recipe.tips,
  setting:{staple:$("#assumeRice").checked?"밥(미리 지어둔 경우)":"밥 준비 필요",side:$("#assumeKimchi").checked?"김치":"김치 준비 필요"}};
}
function refreshShortfalls(p){
 const totals={},available=stockIndex([...state.inventory,...($("#includeCart").checked?state.cart:[])]);
 for(const d of p.days)for(const m of d.meals)for(const ing of m.ingredients||[]){
  if(!totals[ing.key])totals[ing.key]={qty:0,unit:ing.unit};if(totals[ing.key].unit===ing.unit)totals[ing.key].qty+=ing.qty;
 }
 p.shopping=Object.entries(totals).flatMap(([key,v])=>{
  const a=available[key];if(a?.unknown)return [];
  const short=v.qty-(a?.unit===v.unit?a.known:0);
  return short>0?[{key,name:foodName(key),quantity:Math.round(short*100)/100,unit:v.unit}]:[];
 });
}
$("#planGrid").addEventListener("click",e=>{
 const b=e.target.closest("button[data-replace]");if(!b)return;
 const [d,m]=b.dataset.replace.split(":").map(Number),p=currentPlan();if(!p)return;replaceAt={d,m};
 const current=p.days[d].meals[m],inventory=stockIndex(state.inventory);
 const choices=DISHES.filter(r=>r.slots.includes(current.slot)&&r.id!==current.recipeId&&r.time<=Number($("#planTime").value))
  .map(r=>({r,missing:r.ingredients.filter(x=>!inventory[x.key]||inventory[x.key].unit!==x.unit||!inventory[x.key].unknown&&inventory[x.key].known<x.qty).length}))
  .sort((a,b)=>a.missing-b.missing||a.r.time-b.r.time).slice(0,8);
 $("#replaceTitle").textContent=p.days[d].date+" "+current.slot+" 메뉴 변경";
 $("#replaceOptions").innerHTML=choices.map(x=>'<button class="replace-option" data-pick="'+xss(x.r.id)+'"><strong>'+xss(x.r.title)+'</strong>약 '+x.r.time+'분 · '+(x.missing?"추가 재료 "+x.missing+"종":"현재 재고 후보")+'</button>').join("");
 $("#replacementPanel").hidden=false;$("#replacementPanel").scrollIntoView({behavior:"smooth"});
});
$("#replaceCancel").addEventListener("click",()=>{$("#replacementPanel").hidden=true;replaceAt=null;});
$("#replaceOptions").addEventListener("click",e=>{
 const b=e.target.closest("button[data-pick]");if(!b||!replaceAt)return;const r=DISHES.find(x=>x.id===b.dataset.pick);if(!r)return;
 const original=currentPlan();if(!draft)draft=JSON.parse(JSON.stringify(original));
 const {d,m}=replaceAt;draft.days[d].meals[m]=toMeal(r,draft.days[d].meals[m].slot);refreshShortfalls(draft);
 $("#replacementPanel").hidden=true;replaceAt=null;$("#planStatus").textContent="해당 끼니만 교체했습니다. 필요한 추가 재료를 재계산했고, 저장 전 확인해 주세요.";renderPlanner();
});
function renderHome(){
 const spent=weekSpent(weekMonday(today())),month=today().slice(0,7);
 $("#homeInventoryCount").textContent=state.inventory.filter(x=>x.quantity==null||x.quantity>0).length+"개 항목";
 $("#homeSpent").textContent=fmt(spent);$("#homeRemain").textContent=fmt(budget()-spent);
 $("#historySpent").textContent=fmt(spent);$("#historyRemain").textContent=fmt(budget()-spent);
 $("#historyMonth").textContent=fmt(state.purchases.filter(x=>x.date.startsWith(month)).reduce((a,x)=>a+Number(x.paid||0),0));
 const due=state.inventory.filter(x=>x.expiry&&x.expiry<=shiftDate(today(),4)&&(x.quantity==null||x.quantity>0)).sort((a,b)=>a.expiry.localeCompare(b.expiry)).slice(0,5);
 $("#homeExpiring").innerHTML=due.length?due.map(x=>'<div class="item"><strong>'+xss(x.label||foodName(x.key))+'</strong> · '+xss(quantityText(x))+' · '+xss(x.expiry)+'</div>').join(""):'<div class="empty">4일 안에 소비기한이 도래하도록 등록한 품목이 없습니다. 미입력 품목은 직접 확인하세요.</div>';
 const next=shiftDate(weekMonday(today()),7),weekend=[0,6].includes(new Date().getDay());
 $("#weekendDescription").textContent=weekend?"지금은 다음 주("+next+" 시작) 식단을 준비하기 좋은 때입니다. 재고 수량을 확인하고 추천을 생성해 보세요.":"주말에는 다음 주 식재료와 상차림 준비를 제안합니다. 언제든 다음 주 식단을 미리 만들 수 있습니다.";
 $("#homeNextChecklist").innerHTML='<span class="chip">수량 미확인 '+state.inventory.filter(x=>x.quantity==null).length+'종</span><span class="chip">구매 예정 '+state.cart.length+'개</span><span class="chip">실제 구매 '+state.purchases.length+'건</span>';
}
function render(){if(document.activeElement!==$("#planBudget"))$("#planBudget").value=budget();renderHome();renderInventory();renderCart();renderPurchases();if(active==="planner")renderPlanner();}
function download(name,text){const url=URL.createObjectURL(new Blob([text],{type:"application/json"})),a=document.createElement("a");a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$("#exportData").addEventListener("click",()=>download("Meal_backup_"+today()+".json",JSON.stringify({schema:2,data:state,exportedAt:new Date().toISOString()},null,2)));
$("#importData").addEventListener("click",()=>{if(mode==="cloud"){alert("JSON 복원은 로컬 모드에서 지원합니다. 로그아웃 후 가져와 주세요.");return;}$("#backupFile").click();});
$("#backupFile").addEventListener("change",async e=>{
 const f=e.target.files?.[0];if(!f)return;
 try{if(f.size>3e6)throw Error("3MB 이하 파일만 지원합니다.");const o=JSON.parse(await f.text());
 if(o.schema!==2||!Array.isArray(o.data?.inventory)||!Array.isArray(o.data?.cart)||!Array.isArray(o.data?.purchases))throw Error("Meal v2 백업 파일이 아닙니다.");
 if(!confirm("현재 로컬 기록을 이 백업으로 교체할까요?"))return;state={...empty(),...o.data};localWrite();draft=null;render();notify("로컬 백업을 복원했습니다.");
 }catch(err){notify("백업 복원 실패: "+err.message,true);}finally{e.target.value="";}
});
$("#loginBtn").addEventListener("click",async()=>{
 try{notify("Google 로그인 중…");await signInWithPopup(auth,new GoogleAuthProvider());}
 catch(err){notify("로그인 실패: "+(err.code||err.message)+". Firebase Auth Google 제공업체와 github.io 허용 도메인을 확인하세요.",true);}
});
$("#logoutBtn").addEventListener("click",async()=>{try{await signOut(auth);}catch(err){notify("로그아웃 실패: "+err.message,true);}});
function localMode(){
 unsubs.forEach(f=>f());unsubs=[];user=null;mode="local";state=localRead();draft=null;
 $("#accountLabel").textContent="로컬 체험 · 이 기기에만 저장";$("#loginBtn").hidden=false;$("#logoutBtn").hidden=true;$("#copyLocalToCloud").hidden=true;
 notify("로컬 모드 · 로그인하면 Firebase와 계정별로 동기화할 수 있습니다.");render();
}
function firebaseMode(u){
 unsubs.forEach(f=>f());unsubs=[];user=u;mode="cloud";state=empty();draft=null;
 $("#accountLabel").textContent=u.displayName||u.email||"Google 사용자";$("#loginBtn").hidden=true;$("#logoutBtn").hidden=false;$("#copyLocalToCloud").hidden=false;
 notify("Firestore 연결 중…");const got=new Set();
 for(const table of ["inventory","cart","purchases","plans","settings"]){
  const unsub=onSnapshot(collection(db,"users",u.uid,table),snap=>{
   if(table==="plans"){state.plans=Object.fromEntries(snap.docs.map(d=>[d.id,d.data()]));}
   else if(table==="settings"){state.settings=snap.docs.find(d=>d.id==="preferences")?.data()||{budget:80000};}
   else state[table]=snap.docs.map(d=>d.data());
   got.add(table);if(got.size===5)notify("Firebase 동기화 연결됨 · 로그인한 사용자 데이터가 저장됩니다.");render();
  },err=>notify("Firestore 권한 또는 연결 오류: "+(err.code||err.message)+". 데이터베이스와 보안 규칙을 확인하세요.",true));
  unsubs.push(unsub);
 }
}
onAuthStateChanged(auth,u=>{if(u)firebaseMode(u);else localMode();});
$("#copyLocalToCloud").addEventListener("click",async()=>{
 if(mode!=="cloud")return;const source=localRead();
 const n=source.inventory.length+source.cart.length+source.purchases.length+Object.keys(source.plans).length;
 if(!n){alert("가져올 로컬 기록이 없습니다.");return;}
 if(state.inventory.length+state.cart.length+state.purchases.length+Object.keys(state.plans).length){alert("Firebase 계정에 이미 데이터가 있습니다. 중복 방지를 위해 빈 계정에만 가져올 수 있습니다.");return;}
 if(!confirm("로컬 데이터 "+n+"개를 Firebase에 복사할까요? 원본 로컬 기록은 유지됩니다."))return;
 try{
  const all=[...source.inventory.map(x=>["inventory",x]),...source.cart.map(x=>["cart",x]),...source.purchases.map(x=>["purchases",x]),...Object.entries(source.plans).map(([k,x])=>["plans",{...x,id:k}])];
  for(let i=0;i<all.length;i+=300){const b=writeBatch(db);for(const [table,row]of all.slice(i,i+300))b.set(dbRef(table,row.id),row);await b.commit();}
  if(source.settings&&Number.isSafeInteger(Number(source.settings.budget)))await setDoc(dbRef("settings","preferences"),{id:"preferences",budget:Number(source.settings.budget),updatedAt:new Date().toISOString()});
  notify("로컬 기록 "+n+"개를 Firebase에 복사했습니다.");
 }catch(err){notify("가져오기 실패: "+err.message,true);}
});
render();
