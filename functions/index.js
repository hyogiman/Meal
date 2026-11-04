'use strict';
// Meal v2 AI gateway. NEVER put OPENAI_API_KEY in the browser or GitHub.
const {onCall,HttpsError}=require('firebase-functions/v2/https');
const {defineSecret}=require('firebase-functions/params');
const admin=require('firebase-admin');
const OpenAI=require('openai');
admin.initializeApp();
const db=admin.firestore();
const KEY=defineSecret('OPENAI_API_KEY');
const ALLOWED=defineSecret('MEAL_ALLOWED_UIDS');
const REGION='asia-northeast3';
const OPTIONS={region:REGION,secrets:[KEY,ALLOWED],maxInstances:2,timeoutSeconds:240,memory:'512MiB',
  cors:['https://hyogiman.github.io','https://2nhyeok.kr','https://mealplan-786a6.web.app','https://mealplan-786a6.firebaseapp.com']};
const U={type:'object',additionalProperties:false,required:['name','qty','unit'],properties:{
  name:{type:'string'},qty:{type:'number'},unit:{type:'string'}}};
const COURSE={type:'object',additionalProperties:false,required:['title','role','minutes','requiresRice','ingredients','seasonings','steps'],properties:{
  title:{type:'string'},role:{type:'string',enum:['main','soup','side','bowl']},minutes:{type:'number'},
  requiresRice:{type:'boolean'},ingredients:{type:'array',items:U},seasonings:{type:'array',items:U},
  steps:{type:'array',items:{type:'string'}}}};
const MEAL={type:'object',additionalProperties:false,required:['title','courses'],properties:{
  title:{type:'string'},courses:{type:'array',minItems:1,maxItems:2,items:COURSE}}};
const SUGGESTIONS={type:'object',additionalProperties:false,required:['meals'],properties:{
  meals:{type:'array',minItems:3,maxItems:3,items:MEAL}}};
function uid(request){const id=request.auth?.uid;if(!id)throw new HttpsError('unauthenticated','Meal 로그인 후 이용해 주세요.');const allow=(ALLOWED.value()||'').split(',').map(s=>s.trim()).filter(Boolean);if(!allow.includes(id))throw new HttpsError('permission-denied','AI 기능은 등록된 가족 계정에서만 사용할 수 있습니다.');return id;}
function client(){const key=KEY.value();if(!key)throw new HttpsError('failed-precondition','Cloud Functions에 OPENAI_API_KEY 비밀키가 설정되지 않았습니다.');return new OpenAI({apiKey:key,timeout:190000,maxRetries:0});}
function safeNumber(n,def=0){const x=Number(n);return Number.isFinite(x)?x:def;}
exports.analyzeInventoryPhoto=onCall(OPTIONS,async req=>{
  uid(req);
  // Retired endpoint also protects cached clients from starting paid photo requests.
  throw new HttpsError('failed-precondition','사진 기능은 종료했습니다. 재료를 직접 입력해 주세요.');
});
exports.suggestMeals=onCall(OPTIONS,async req=>{
  const user=uid(req),arg=req.data||{},servings=safeNumber(arg.servings);
  if(arg.mode!=='single')throw new HttpsError('failed-precondition','한 끼 추천으로 변경되었습니다. 페이지를 새로고침해 주세요.');
  const date=typeof arg.date==='string'?arg.date:'';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T12:00:00Z'))||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date||!['아침','점심','저녁'].includes(arg.slot)||!Number.isInteger(servings)||servings<1||servings>4)
    throw new HttpsError('invalid-argument','날짜, 끼니와 인원 수를 확인해 주세요.');
  const maxMinutes=Math.max(15,Math.min(70,safeNumber(arg.maxMinutes,35)));
  // Meal planning is user-triggered and has no application-level daily quota.
  try{
    const [stock,buy,settings]=await Promise.all([
      db.collection('users/'+user+'/inventory').limit(150).get(),
      db.collection('users/'+user+'/wishlist').limit(80).get(),
      db.doc('users/'+user+'/settings/profile').get()]);
    const inventory=stock.docs.map(x=>x.data()).map(x=>({name:String(x.name||'').slice(0,80),qty:safeNumber(x.qty),unit:String(x.unit||''),unitGrams:safeNumber(x.unitGrams),expiryDate:String(x.expiryDate||'')})).filter(x=>x.qty>0);
    const wishlist=buy.docs.map(x=>x.data()).map(x=>({name:String(x.name||'').slice(0,80),qty:safeNumber(x.qty),unit:String(x.unit||''),estimate:x.estimate==null?null:safeNumber(x.estimate)}));
    const prompt={date,slot:arg.slot,servings,maxMinutes,style:arg.style==='lowcarb'?'밥·면에 치우치지 않고 단백질과 채소를 포함':arg.style==='varied'?'익숙한 한국 가정식과 일부 면요리':'익숙한 한국 가정식',
      inventory,wishlist,weeklyBudget:safeNumber(settings.data()?.budget,80000)};
    const rules=[
      '선택한 날짜의 한 끼를 위한 서로 다른 메뉴 후보 정확히 3개를 JSON meals 배열로 작성하세요. 주간 식단을 만들지 마세요.',
      '이미 만들어진 음식은 밥과 김치뿐입니다. 모든 추가 국/반찬/주찬은 별도의 course로 구성합니다.',
      '각 후보는 주찬 1개를 기본으로 하고 꼭 필요한 경우만 별도 국/반찬을 추가합니다. 각 course에 식재료, 양념, 간결한 조리순서 4단계와 조리시간을 적으세요.',
      '재료·양념의 수량은 요청한 servings 전체 분량이며 가능한 g/ml를 사용하세요. 쌀밥을 별도로 곁들일 때만 requiresRice=true로 표시하세요. 밥이 재료에 들어가거나 국수/파스타인 경우 false입니다.',
      '한 끼 조리시간은 각 course minutes 합으로 계산하고 가능한 한 maxMinutes 이하여야 합니다.',
      '익숙한 김치찌개, 제육볶음, 만둣국, 계란국, 생선구이 등이 우선입니다. 생소한 미역만둣국 등은 만들지 마세요.',
      '재고를 우선 활용하고 가격과 영양 수치를 지어내지 마세요. 세 후보는 서로 대안이지 함께 먹는 식단이 아닙니다.',
      '상차림 구성을 위해 매번 국/반찬을 추가할 필요는 없습니다. 밥+주찬+김치도 가능합니다.',
      '모든 재료량은 지정된 식사 인원 전체 기준이며, 출처 없는 영양정보는 생성하지 마세요. 결과는 사용자 검토 전 초안입니다.'
    ].join('\n');
    const r=await client().responses.create({model:'gpt-6.1-terra',instructions:rules,
      input:[{role:'user',content:JSON.stringify(prompt)}],
      text:{format:{type:'json_schema',name:'meal_single_options',strict:true,schema:SUGGESTIONS}},max_output_tokens:5000,store:false});
    const result=JSON.parse(r.output_text||'{}');
    if(r.status==='incomplete'||!Array.isArray(result.meals)||result.meals.length!==3||result.meals.some(m=>!Array.isArray(m.courses)||m.courses.length<1||m.courses.length>2))throw Error('meal options structure invalid');
    return {meals:result.meals,disclaimer:'한 끼 후보입니다. 하나를 선택하고 재료·수량을 확인한 뒤 반영하세요.'};
  }catch(e){console.error('Meal plan error',e?.status||e?.code||'unknown');throw new HttpsError('internal','AI 식단 추천에 실패했습니다. 내장 레시피를 이용해 주세요.');}
});

