'use strict';
// Meal v2 AI gateway. NEVER put OPENAI_API_KEY in the browser or GitHub.
const {onCall,HttpsError}=require('firebase-functions/v2/https');
const {defineSecret}=require('firebase-functions/params');
const admin=require('firebase-admin');
const OpenAI=require('openai');
admin.initializeApp();
const db=admin.firestore();
const KEY=defineSecret('OPENAI_API_KEY');
const REGION='asia-northeast3';
const OPTIONS={region:REGION,secrets:[KEY],maxInstances:2,timeoutSeconds:240,memory:'512MiB',
  cors:['https://hyogiman.github.io','https://mealplan-786a6.web.app','https://mealplan-786a6.firebaseapp.com']};
const U={type:'object',additionalProperties:false,required:['name','qty','unit'],properties:{
  name:{type:'string'},qty:{type:'number'},unit:{type:'string'}}};
const COURSE={type:'object',additionalProperties:false,required:['title','role','minutes','requiresRice','ingredients','seasonings','steps'],properties:{
  title:{type:'string'},role:{type:'string',enum:['main','soup','side','bowl']},minutes:{type:'number'},
  requiresRice:{type:'boolean'},ingredients:{type:'array',items:U},seasonings:{type:'array',items:U},
  steps:{type:'array',items:{type:'string'}}}};
const MEAL={type:'object',additionalProperties:false,required:['title','courses','missing'],properties:{
  title:{type:'string'},courses:{type:'array',items:COURSE},missing:{type:'array',items:U}}};
const PLAN={type:'object',additionalProperties:false,required:['days'],properties:{
  days:{type:'array',items:{type:'object',additionalProperties:false,required:['meals'],properties:{meals:{type:'array',items:MEAL}}}}}};
const PHOTO={type:'object',additionalProperties:false,required:['items','notes'],properties:{
  items:{type:'array',items:{type:'object',additionalProperties:false,required:['name','qty','unit','category','confidence'],properties:{
    name:{type:'string'},qty:{type:['number','null']},unit:{type:['string','null']},
    category:{type:['string','null']},confidence:{type:'string',enum:['high','medium','low']}}}},
  notes:{type:'string'}}};
function uid(request){if(!request.auth?.uid)throw new HttpsError('unauthenticated','Meal 로그인 후 이용해 주세요.');return request.auth.uid;}
function localDay(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
async function quota(user,field,cap){
  const ref=db.doc('users/'+user+'/usage/'+localDay());
  await db.runTransaction(async t=>{
    const x=await t.get(ref),count=Number(x.data()?.[field]||0);
    if(count>=cap)throw new HttpsError('resource-exhausted','오늘의 AI 요청 한도에 도달했습니다.');
    t.set(ref,{[field]:count+1},{merge:true});
  });
}
function client(){const key=KEY.value();if(!key)throw new HttpsError('failed-precondition','Cloud Functions에 OPENAI_API_KEY 비밀키가 설정되지 않았습니다.');return new OpenAI({apiKey:key,timeout:190000,maxRetries:1});}
function safeNumber(n,def=0){const x=Number(n);return Number.isFinite(x)?x:def;}
exports.analyzeInventoryPhoto=onCall(OPTIONS,async req=>{
  const user=uid(req),images=req.data?.images;
  if(!Array.isArray(images)||images.length<1||images.length>3)throw new HttpsError('invalid-argument','이미지는 1~3장까지 가능합니다.');
  if(images.some(x=>typeof x!=='string'||x.length>2500000||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(x)))throw new HttpsError('invalid-argument','이미지 형식 또는 크기가 올바르지 않습니다.');
  await quota(user,'photoCalls',5);
  try{
    const content=[{type:'input_text',text:'한국 가정의 냉장고·구매품 사진입니다. 사진에 보이는 품목만 반환하세요. 수량이나 라벨이 불확실하면 null을 사용하고 보이지 않는 물건을 추정하지 마세요. 인식 결과는 저장하지 않고 사용자가 먼저 검토합니다.'},
      ...images.map(x=>({type:'input_image',image_url:x,detail:'low'}))];
    const r=await client().responses.create({model:'gpt-6-luna',input:[{role:'user',content}],
      text:{format:{type:'json_schema',name:'meal_inventory_candidates',strict:true,schema:PHOTO}},
      max_output_tokens:2500,store:false});
    const parsed=JSON.parse(r.output_text||'{}');
    return {items:Array.isArray(parsed.items)?parsed.items.slice(0,30):[],notes:String(parsed.notes||'').slice(0,1000)};
  }catch(e){console.error('Meal photo error',e?.status||e?.code||'unknown');throw new HttpsError('internal','사진 분석에 실패했습니다.');}
});
exports.suggestMeals=onCall(OPTIONS,async req=>{
  const user=uid(req),arg=req.data||{},servings=safeNumber(arg.servings);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(arg.startDate||'')||!Number.isInteger(servings)||servings<1||servings>4)
    throw new HttpsError('invalid-argument','시작일과 인원 수를 확인해 주세요.');
  const maxMinutes=Math.max(15,Math.min(70,safeNumber(arg.maxMinutes,35)));
  await quota(user,'planCalls',2);
  try{
    const [stock,buy,settings]=await Promise.all([
      db.collection('users/'+user+'/inventory').limit(150).get(),
      db.collection('users/'+user+'/wishlist').limit(80).get(),
      db.doc('users/'+user+'/settings/profile').get()]);
    const inventory=stock.docs.map(x=>x.data()).map(x=>({name:String(x.name||'').slice(0,80),qty:safeNumber(x.qty),unit:String(x.unit||''),unitGrams:safeNumber(x.unitGrams),expiryDate:String(x.expiryDate||'')})).filter(x=>x.qty>0);
    const wishlist=buy.docs.map(x=>x.data()).map(x=>({name:String(x.name||'').slice(0,80),qty:safeNumber(x.qty),unit:String(x.unit||''),estimate:x.estimate==null?null:safeNumber(x.estimate)}));
    const prompt={startDate:arg.startDate,servings,maxMinutes,style:arg.style==='varied'?'익숙한 한국 가정식과 일부 면요리':'익숙한 한국 가정식',
      inventory,wishlist,weeklyBudget:safeNumber(settings.data()?.budget,80000)};
    const rules=[
      '한국 가정식 식단 생성기입니다. 7일 x 아침/점심/저녁 정확히 21끼를 JSON으로 작성하세요.',
      '이미 만들어진 음식은 밥과 김치뿐입니다. 모든 추가 국/반찬/주찬은 별도의 course로 구성합니다.',
      '각 course는 정확한 식재료 g/ml/개, 간장/설탕/마늘 등의 양념 배합, 실제 조리순서 4~7단계와 조리시간을 적으세요.',
      '한 끼 조리시간은 각 course minutes 합으로 계산하고 가능한 한 maxMinutes 이하여야 합니다.',
      '익숙한 김치찌개, 제육볶음, 만둣국, 계란국, 생선구이 등이 우선입니다. 생소한 미역만둣국 등은 만들지 마세요.',
      '부족한 품목은 missing에 기록하고 가격을 지어내지 마세요. 재고를 주간 전체에서 중복 과다 사용하지 마세요.',
      '상차림 구성을 위해 매번 국/반찬을 추가할 필요는 없습니다. 밥+주찬+김치도 가능합니다.',
      '모든 재료량은 지정된 식사 인원 전체 기준이며, 출처 없는 영양정보는 생성하지 마세요. 결과는 사용자 검토 전 초안입니다.'
    ].join('\n');
    const r=await client().responses.create({model:'gpt-6.1-terra',instructions:rules,
      input:[{role:'user',content:JSON.stringify(prompt)}],
      text:{format:{type:'json_schema',name:'meal_family_week_plan',strict:true,schema:PLAN}},max_output_tokens:16000,store:false});
    const plan=JSON.parse(r.output_text||'{}');
    if(!Array.isArray(plan.days)||plan.days.length!==7||plan.days.some(x=>!Array.isArray(x.meals)||x.meals.length!==3))throw Error('meal plan structure invalid');
    return {plan,disclaimer:'AI 제안은 가격 또는 영양성분 확정값이 아닙니다. 저장 전 실제 수량, 양념, 조리시간을 확인해 주세요.'};
  }catch(e){console.error('Meal plan error',e?.status||e?.code||'unknown');throw new HttpsError('internal','AI 식단 추천에 실패했습니다. 내장 레시피를 이용해 주세요.');}
});
