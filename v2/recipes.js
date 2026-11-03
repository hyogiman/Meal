
// Meal 2.0 local household recipe library — each dish is freshly prepared.
// Rice and kimchi are the ONLY assumed ready-to-serve accompaniments. No hidden soups/sides.
export const FOODS=[
["rice","쌀·밥","g","곡류"],["kimchi","김치","g","반찬·양념"],["egg","달걀","개","달걀·유제품"],["tuna","참치캔","캔","단백질"],["dumpling","냉동만두","g","냉동·가공"],["gim","식탁김","봉","반찬·양념"],["spinach","시금치","단","채소"],["bokchoy","청경채","g","채소"],["cabbage","양배추","통","채소"],["onion","양파","g","채소"],["greenonion","대파","g","채소"],["miyeok","건미역","g","건어물"],["dashima","다시마","g","건어물"],["curry","카레가루","g","반찬·양념"],["potato","감자","g","채소"],["carrot","당근","g","채소"],["cucumber","오이","개","채소"],["radish","무","g","채소"],["sprouts","콩나물","g","채소"],["pork","돼지고기","g","단백질"],["chicken","닭고기","g","단백질"],["mackerel","고등어","g","단백질"],["tofu","두부·순두부","g","단백질"],["fishcake","어묵","g","냉동·가공"],["noodle","소면","g","곡류"],["pasta","스파게티면","g","곡류"],["banana","바나나","개","과일"],["milk","우유","ml","달걀·유제품"],["beef","소고기","g","단백질"],["zucchini","애호박","g","채소"],["mushroom","버섯","g","채소"],["garlic","마늘","g","반찬·양념"],["seaweed","조미김","봉","반찬·양념"]
].map(([id,name,unit,category])=>({id,name,unit,category}));
export const FOOD_BY_ID=Object.fromEntries(FOODS.map(f=>[f.id,f]));
const I=(key,qty,unit)=>({key,qty,unit:unit||FOOD_BY_ID[key]?.unit||"g"});
const R=(id,title,slots,time,ingredients,seasoning,steps,kind="주찬",tips="")=>({id,title,slots,time,ingredients:ingredients.map(a=>I(...a)),seasoning,steps,kind,tips,servings:2,base:"밥·김치",prepared:[title]});
export const DISHES=[
R("egg_rice","달걀볶음밥",["아침","점심","저녁"],15,[["egg",2],["onion",70],["greenonion",20]],
"간장 1큰술(15ml), 식용유 2작은술(10ml), 소금 1꼬집, 후추 약간",
["양파와 대파를 잘게 썰고 달걀 2개를 풀어 둡니다.","팬에 기름 1작은술을 두르고 달걀을 스크램블로 익혀 덜어 냅니다.","남은 기름에 양파·대파를 볶고 지은 밥 2공기를 넣습니다.","달걀을 합치고 간장을 팬 가장자리에 둘러 1분 볶습니다."],"한그릇","이미 지어둔 밥 2공기 사용, 별도 국·반찬 조리 없음"),
R("tuna_ball","참치 김주먹밥",["아침","점심"],12,[["tuna",1],["gim",2]],
"참기름 1작은술(5ml), 소금 1꼬집, 깨 1작은술",
["참치 1캔의 기름이나 물을 빼 둡니다.","김 2봉을 잘게 부수고 밥 2공기와 참치를 섞습니다.","참기름·소금·깨로 간하고 먹기 좋게 주먹밥을 만듭니다."],"한그릇","추가로 만드는 국·반찬은 없습니다"),
R("kimchi_fried","김치볶음밥",["아침","점심","저녁"],15,[["kimchi",180],["egg",2]],
"식용유 1큰술(15ml), 간장 1작은술(5ml), 설탕 1/2작은술(2g)",
["김치를 잘게 썰어 팬에서 기름과 설탕을 넣고 3분 볶습니다.","밥 2공기를 넣고 고루 볶아 간장으로 간합니다.","별도 팬 또는 팬 한쪽에서 달걀 2개를 익혀 밥 위에 얹습니다."],"한그릇","김치는 볶음밥 재료로 사용하며 별도 곁들임은 선택"),
R("dumpling_soup","맑은 만둣국",["아침","점심","저녁"],22,[["dumpling",350],["radish",100],["greenonion",20]],
"육수용 다시마 1장(있을 때), 국간장 2작은술(10ml), 다진 마늘 1작은술, 소금 약간",
["무를 얇게 썰고 물 900ml에 8분 끓입니다. 다시마가 있으면 함께 끓인 뒤 건져냅니다.","냉동만두 350g을 넣고 제품 표시대로 속까지 충분히 익힙니다.","대파와 다진 마늘을 넣고 국간장·소금으로 간합니다.","그릇에 나누고 밥과 김치를 곁들입니다."],"국","미역 없이 만드는 일반적인 맑은 만둣국"),
R("egg_soup","달걀국",["아침","점심"],13,[["egg",2],["greenonion",20]],
"국간장 1작은술(5ml), 다진 마늘 1/2작은술, 소금 약간",
["물 700ml에 다진 마늘·국간장을 넣고 끓입니다.","달걀 2개를 풀고 끓는 국에 가늘게 부어 익힙니다.","대파를 넣고 한 번 더 끓여 밥·김치와 먹습니다."],"국"),
R("spinach_soup","시금치된장국",["아침","점심"],17,[["spinach",0.5,"단"],["tofu",150]],
"된장 1과 1/2큰술(25g), 다진 마늘 1/2작은술, 멸치육수 또는 물 800ml",
["시금치 1/2단을 씻어 줄기를 다듬습니다.","냄비에 물 800ml를 끓이고 된장을 풀어 줍니다.","시금치와 한입 크기로 썬 두부를 넣고 5~7분 끓입니다.","마늘로 향을 더하고 밥·김치와 먹습니다."],"국"),
R("tuna_stew","참치김치찌개",["점심","저녁"],22,[["tuna",1],["kimchi",220],["onion",80]],
"고춧가루 1작은술, 다진 마늘 1작은술, 설탕 1/2작은술, 국간장 1작은술",
["김치 220g과 양파를 냄비에서 참치 기름 약간과 함께 3분 볶습니다.","물 700ml와 고춧가루·마늘을 넣고 10분 끓입니다.","참치 1캔을 넣고 5분 더 끓입니다.","김치 신맛에 따라 설탕을 소량만 더한 뒤 밥과 먹습니다."],"찌개"),
R("pork_stew","돼지고기 김치찌개",["점심","저녁"],30,[["pork",250],["kimchi",220],["onion",80]],
"국간장 1큰술(15ml), 고춧가루 1작은술, 다진 마늘 1작은술, 설탕 1/2작은술",
["돼지고기 250g과 김치 220g을 냄비에 볶아 고기 표면을 익힙니다.","양파와 물 850ml, 고춧가루·마늘을 넣고 끓입니다.","고기가 속까지 익도록 15분 이상 끓이고 국간장으로 간합니다.","밥 2공기와 김치를 곁들입니다."],"찌개"),
R("pork_bulgogi","돼지고기 간장불고기",["점심","저녁"],23,[["pork",300],["onion",100],["greenonion",30]],
"진간장 2큰술(30ml), 다진 마늘 1작은술, 설탕 1큰술(12g), 참기름 1작은술, 후추 조금",
["볼에 모든 양념을 섞어 300g 돼지고기에 골고루 버무립니다.","양파·대파를 썰어 준비합니다.","달군 팬에 고기를 넣고 속까지 익힙니다.","양파·대파를 함께 볶아 밥과 김치 옆에 담습니다."],"주찬"),
R("pork_cabbage","돼지고기 양배추볶음",["점심","저녁"],22,[["pork",250],["cabbage",0.15,"통"],["onion",80]],
"간장 2큰술, 다진 마늘 1작은술, 설탕 1작은술, 식용유 1작은술, 후추",
["돼지고기를 한입 크기로 썰고 양배추 0.15통을 채 썹니다.","팬에 식용유와 고기를 넣고 충분히 익힙니다.","양파·양배추를 넣어 4~5분 볶습니다.","간장·마늘·설탕을 넣고 1분 더 볶아 밥과 냅니다."],"주찬"),
R("chicken_soy","닭고기 간장볶음",["점심","저녁"],24,[["chicken",300],["onion",100],["greenonion",25]],
"간장 2큰술, 설탕 1작은술, 다진 마늘 1작은술, 식용유 1작은술, 후추",
["닭고기 300g을 한입 크기로 자르고 양념에 5분 재웁니다.","양파와 대파를 채 썹니다.","팬에 닭고기를 볶다가 채소를 넣고 골고루 익힙니다.","닭고기 가운데까지 완전히 익힌 뒤 밥·김치와 먹습니다."],"주찬"),
R("chicken_curry","닭고기 감자카레",["점심","저녁"],34,[["chicken",300],["potato",300],["onion",140],["carrot",100],["curry",90]],
"보유 카레가루 약 90g(제품 설명의 4인분 여부 확인), 식용유 1작은술, 물은 제품 포장 안내량",
["닭고기와 감자·양파·당근을 한입 크기로 자릅니다.","닭고기를 팬에서 먼저 익히고 채소를 넣어 2~3분 볶습니다.","제품 설명에 맞게 물을 붓고 감자와 닭고기가 충분히 익도록 끓입니다.","불을 줄이고 카레를 풀어 4~5분 끓입니다.","밥 2공기에 카레를 나눠 담고 김치를 곁들입니다."],"한그릇","카레가루에 적힌 인분/물 비율에 맞춰 조절하세요"),
R("chicken_bokchoy","닭고기 청경채볶음",["점심","저녁"],23,[["chicken",300],["bokchoy",150],["onion",70]],
"간장 1과 1/2큰술, 다진 마늘 1작은술, 설탕 1작은술, 식용유 1작은술",
["닭고기를 작은 조각으로 잘라 양념을 버무립니다.","팬에 닭을 먼저 익히다가 양파를 넣습니다.","닭이 거의 익으면 씻은 청경채를 넣고 숨이 죽을 때까지 볶습니다.","닭고기가 완전히 익었는지 확인하고 밥·김치와 먹습니다."],"주찬"),
R("mackerel_grill","고등어구이",["점심","저녁"],19,[["mackerel",280]],
"소금 1~2꼬집(간고등어는 생략), 식용유 1작은술",
["고등어 280g을 키친타월로 눌러 물기를 제거합니다.","팬에 기름을 살짝 바르고 중약불에서 앞뒤로 익힙니다.","두꺼운 부분까지 익었는지 확인하고 밥·김치와 냅니다.","가시가 제거된 제품도 먹기 전에 잔가시를 확인합니다."],"주찬"),
R("mackerel_radish","고등어 무조림",["점심","저녁"],32,[["mackerel",280],["radish",260],["greenonion",25]],
"진간장 2큰술, 고춧가루 1큰술, 다진 마늘 1큰술, 설탕 1작은술, 물 250ml",
["간장·고춧가루·마늘·설탕·물을 한 그릇에 섞어 조림양념을 만듭니다.","무 260g을 두껍게 썰어 냄비 바닥에 깔고 양념 절반을 붓습니다.","8분 끓인 뒤 고등어와 남은 양념을 올리고 15분 이상 조립니다.","생선 속이 완전히 익었는지 확인한 뒤 대파를 넣어 마무리합니다."],"주찬"),
R("tofu_stew","순두부찌개",["점심","저녁"],20,[["tofu",350],["egg",1],["onion",70]],
"국간장 1큰술, 고춧가루 1큰술, 다진 마늘 1작은술, 식용유 1작은술",
["팬에 기름·고춧가루·마늘을 약불에서 볶아 향을 냅니다.","물 650ml와 양파를 넣어 5분 끓입니다.","순두부 350g을 떠 넣고 5분 끓입니다.","달걀 1개를 깨 넣어 충분히 익히고 간을 맞춘 후 밥·김치와 먹습니다."],"찌개"),
R("tofu_soy","두부 간장조림",["점심","저녁"],19,[["tofu",400],["greenonion",20]],
"간장 2큰술, 다진 마늘 1작은술, 고춧가루 1작은술, 설탕 1작은술, 물 100ml",
["두부 400g을 도톰하게 썰어 물기를 닦습니다.","팬에 식용유 약간을 두르고 앞뒤로 굽습니다.","간장·마늘·고춧가루·설탕·물을 섞어 부어 조립니다.","대파를 뿌려 밥·김치와 냅니다."],"주찬"),
R("fishcake_soup","어묵국",["아침","점심","저녁"],20,[["fishcake",220],["radish",130],["greenonion",25]],
"다시마 우린 물 850ml(없으면 물), 국간장 2작은술, 다진 마늘 1/2작은술, 소금 약간",
["무를 얇게 썰어 육수에 8분 끓입니다.","어묵을 먹기 좋게 자르고 물에 한 번 데칠 수 있습니다.","어묵과 마늘을 넣어 5분 끓입니다.","대파를 넣고 국간장으로 간합니다."],"국"),
R("fishcake_rice","어묵 채소볶음밥",["아침","점심"],17,[["fishcake",150],["carrot",80],["onion",70]],
"간장 1큰술, 식용유 2작은술, 다진 마늘 1/2작은술",
["어묵·당근·양파를 작게 썰어 줍니다.","팬에서 채소와 어묵을 4~5분 볶습니다.","지은 밥 2공기를 넣어 풀어주고 간장으로 간합니다.","김치를 곁들입니다."],"한그릇"),
R("bean_soup","콩나물국",["아침","점심"],17,[["sprouts",220],["greenonion",20]],
"국간장 1큰술, 다진 마늘 1/2작은술, 소금 약간",
["콩나물 220g을 충분히 씻습니다.","물 800ml를 끓여 콩나물을 넣고 6분 이상 익힙니다.","대파와 다진 마늘을 넣고 국간장·소금으로 간합니다.","밥과 김치를 곁들입니다."],"국"),
R("potato_egg","감자 달걀국",["아침","점심"],20,[["potato",250],["egg",2],["greenonion",20]],
"국간장 1작은술, 소금 1/4작은술, 다진 마늘 1/2작은술",
["감자 250g을 얇게 썰어 물 800ml에 넣고 끓입니다.","감자가 거의 익으면 달걀 2개를 풀어 넣습니다.","대파와 마늘을 넣고 국간장과 소금으로 간합니다.","밥과 김치를 곁들입니다."],"국"),
R("soy_egg","달걀장조림 스타일 볶음",["아침","점심"],15,[["egg",3],["onion",60]],
"간장 1과 1/2큰술, 물 3큰술, 설탕 1작은술, 참기름 1/2작은술",
["달걀 3개를 팬에서 반숙보다 조금 더 익힙니다.","양파를 볶다가 간장·물·설탕을 넣어 약불로 2분 졸입니다.","달걀과 양파를 함께 밥 위에 얹고 참기름을 조금 뿌립니다."],"한그릇"),
R("tuna_pasta","참치 마늘 오일파스타",["점심","저녁"],22,[["pasta",200],["tuna",1],["garlic",15]],
"식용유 2큰술, 다진 마늘 2작은술(있을 경우), 소금 1/4작은술, 후추 약간",
["물에 소금을 약간 넣고 파스타면 200g을 포장 안내대로 삶습니다.","팬에 기름과 마늘을 넣고 약불에서 타지 않게 볶습니다.","물기 뺀 참치를 넣고 섞다가 삶은 면과 면수 4큰술을 더합니다.","간을 맞춰 두 접시에 나눠 담습니다."],"한그릇","별도 국·반찬을 만드는 것으로 계산하지 않습니다"),
R("tuna_noodle","참치 비빔국수",["점심","저녁"],19,[["noodle",200],["tuna",1],["cucumber",0.5,"개"]],
"고추장 1과 1/2큰술, 식초 1과 1/2큰술, 설탕 1작은술, 참기름 1작은술, 깨",
["고추장·식초·설탕·참기름을 섞어 양념장을 만듭니다.","소면 200g을 삶아 찬물에 헹구고 물기를 뺍니다.","오이 1/2개를 채 썰고 참치의 기름을 빼 둡니다.","소면에 양념장을 조금씩 섞어 가며 오이와 참치를 올립니다."],"한그릇"),
R("potato_pancake","감자전",["아침","점심"],23,[["potato",350]],
"식용유 1큰술, 소금 1/4작은술, 찍어먹을 간장 1큰술·식초 1/2작은술",
["감자 350g을 씻어 강판에 갈고 물기를 조금 짭니다.","나온 물의 전분을 가라앉힌 후 윗물을 버리고 전분을 감자에 다시 섞습니다.","간을 하고 팬에 얇게 펼쳐 앞뒤로 노릇하게 익힙니다.","간장·식초를 섞은 소스를 곁들입니다."],"주찬","아침을 이것만 먹으면 부족할 수 있어 밥·김치를 함께 제공합니다"),
R("cabbage_egg","양배추 달걀볶음",["아침","점심"],14,[["cabbage",0.12,"통"],["egg",2]],
"간장 1작은술, 소금 1꼬집, 식용유 2작은술, 후추 약간",
["양배추를 얇게 채 썰고 달걀 2개를 풀어 둡니다.","팬에 기름을 두르고 양배추를 3분 볶습니다.","달걀을 붓고 저어가며 속까지 익힙니다.","간장·후추로 간하고 밥·김치를 곁들입니다."],"주찬"),
R("spinach_namul","시금치나물 + 달걀프라이",["아침","점심"],18,[["spinach",0.5,"단"],["egg",2]],
"시금치: 국간장 1작은술·참기름 1작은술·깨 1작은술·다진 마늘 1/2작은술 / 달걀: 기름 1작은술",
["시금치를 끓는 물에 짧게 데치고 찬물에 헹궈 꼭 짭니다(약 7분).","국간장·마늘·참기름·깨를 넣고 시금치를 무칩니다(약 3분).","팬에 달걀 2개를 완숙으로 부칩니다(약 5분).","밥과 김치를 함께 상에 차립니다."],"주찬+부찬","두 가지를 실제 조리하므로 총 18분으로 계산합니다"),
R("bokchoy_egg","청경채 달걀볶음",["아침","점심"],14,[["bokchoy",150],["egg",2]],
"간장 1작은술, 다진 마늘 1/2작은술, 식용유 2작은술",
["청경채를 씻어 한입 크기로 썰고 달걀을 풀어 둡니다.","팬에서 달걀을 먼저 익혀 덜어 냅니다.","청경채를 볶고 간장·마늘로 간한 뒤 달걀을 되돌립니다.","밥과 김치에 곁들입니다."],"주찬")
];
export const STARTER_STOCK=[
["rice",null,"g","실온","사용자가 쌀을 보유한다고 알려줌. 실제 수량 확인 필요"],["kimchi",null,"g","냉장","김치 보유, 수량 미확인"],["egg",10,"개","냉장","달걀 약 10개"],["tuna",5,"캔","실온","참치캔 5개"],["dumpling",500,"g","냉동","냉동만두 약 500g"],["gim",20,"봉","실온","5g 식탁김 20봉 이상; 최소 20봉"],["spinach",0.5,"단","냉장","시금치 반 단"],["bokchoy",null,"g","냉장","청경채, 양 미확인"],["cabbage",0.25,"통","냉장","양배추 1/4통"],["onion",null,"g","실온","비교적 넉넉하나 양 미확인"],["greenonion",null,"g","냉장","대파 넉넉, 양 미확인"],["miyeok",null,"g","실온","많이 있음, 중량 미확인"],["dashima",null,"g","실온","많이 있음, 중량 미확인"],["curry",null,"g","실온","카레가루 보유, 중량 미확인"]
].map(([key,quantity,unit,place,note])=>({key,quantity,unit,place,note}));
export const COUPANG_CART=[
["tofu","곰곰 100% 국산콩 순두부 400g",400,"g",1520],["mackerel","가시제거 고등어 550g",550,"g",17010],["pork","돼지 앞다리살 찌개용 500g",500,"g",10900],["chicken","하림 닭다리살 냉장 600g",600,"g",12800],
["cucumber","국내산 백오이 2개",2,"개",1680],["sprouts","풀무원 콩나물 480g",480,"g",2050],["radish","국내산 무 1개",1,"개",1580],["carrot","흙당근 2개",2,"개",1960],["potato","감자 1kg",1000,"g",2880],
["fishcake","부산어묵 500g",500,"g",2330],["pasta","스파게티면 500g",500,"g",2620],["noodle","소면 500g",500,"g",2290],["banana","바나나 약 1kg",1000,"g",3990],["milk","우유 1L",1000,"ml",2810]
].map(([key,name,quantity,unit,displayPrice])=>({key,name,quantity,unit,displayPrice,source:"2026-11-01 제공 쿠팡 캡처 · 결제 전"}));
export const CART_SUM=COUPANG_CART.reduce((sum,x)=>sum+x.displayPrice,0);
const dateAtNoon=iso=>new Date(iso+"T12:00:00");
export function weekMonday(iso){const d=dateAtNoon(iso);d.setDate(d.getDate()-(d.getDay()+6)%7);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");}
export function shiftDate(iso,n){const d=dateAtNoon(iso);d.setDate(d.getDate()+n);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");}
const similar=(a,b)=>a===b;
export function stockIndex(stock){
 const totals={};
 for(const x of stock){
  if(x.status==="removed")continue;
  if(!totals[x.key])totals[x.key]={known:0,unknown:false,unit:x.unit,count:0};
  const v=totals[x.key];
  if(v.unit!==x.unit){v.unknown=true;continue;}
  if(x.quantity==null||x.quantity==="")v.unknown=true;
  else v.known+=Number(x.quantity);
  v.count++;
 }
 return totals;
}
function needMissing(recipe,stock){
 const missing=[],uncertain=[];
 for(const req of recipe.ingredients){
  // Rice and kimchi are not assumed to be cooked automatically as part of soup/side;
  // they are assumed as table staples when the toggle is on.
  const a=stock[req.key];
  if(!a){missing.push({...req,missing:req.qty});continue;}
  if(a.unit!==req.unit){uncertain.push({...req,reason:"단위 다름"});continue;}
  if(a.known>=req.qty)continue;
  if(a.unknown){uncertain.push({...req,reason:"재고 수량 미확인"});continue;}
  missing.push({...req,missing:+(req.qty-a.known).toFixed(2)});
 }
 return {missing,uncertain};
}
const stableSort=(a,b)=>b.score-a.score||a.recipe.id.localeCompare(b.recipe.id);
export function generatePlan({stock=[],planned=[],includePlanned=false,maxMinutes=35,weekStart,basics={rice:true,kimchi:true,seasonings:true},avoid=[]}){
 const allowed=stock.filter(x=>x.key&&x.status!=="removed");
 const effective=[...allowed,...(includePlanned?planned.filter(x=>x.status==="planned").map(x=>({key:x.key,quantity:x.quantity,unit:x.unit})):[])];
 const index=stockIndex(effective),remaining=Object.fromEntries(Object.entries(index).map(([k,v])=>[k,{...v}]));
 const mealSlots=["아침","점심","저녁"];
 const days=[],usage={},shoppingNeeds={};
 for(let d=0;d<7;d++){
  const meals=[];
  for(const slot of mealSlots){
   const pool=DISHES.filter(x=>x.slots.includes(slot)&&x.time<=maxMinutes&&!avoid.includes(x.id));
   const ranked=pool.map(recipe=>{
    const {missing,uncertain}=needMissing(recipe,remaining);
    const protein=recipe.ingredients.some(x=>["egg","tuna","dumpling","pork","chicken","mackerel","tofu","fishcake","beef"].includes(x.key));
    const repeat=usage[recipe.id]||0;
    const sameYesterday=days[d-1]?.meals.some(m=>m.recipeId===recipe.id);
    const sameToday=meals.some(m=>m.recipeId===recipe.id);
    // Never pretend missing ingredients are in the fridge. Uncertain quantities remain flagged.
    const score=100-missing.length*32-uncertain.length*6-repeat*16-(repeat>=3?30:0)
      -(sameYesterday?12:0)-(sameToday?35:0)+((slot==="저녁"&&protein)?8:0)-recipe.time*0.2;
    return {recipe,missing,uncertain,score};
   }).sort(stableSort);
   const best=ranked[0];
   if(!best){meals.push({slot,recipeId:null,title:"조리 가능한 후보 없음",kind:"미정",time:0,missing:[],uncertain:[],status:"need-input"});continue;}
   const {recipe,missing,uncertain}=best;usage[recipe.id]=(usage[recipe.id]||0)+1;
   // Reserve known stock for planned meals. Missing amounts are kept explicit.
   for(const req of recipe.ingredients){
    const a=remaining[req.key];if(!a){
      shoppingNeeds[req.key]=(shoppingNeeds[req.key]||0)+req.qty;
    }else if(a.unit===req.unit){
      const used=Math.min(a.known,req.qty);
      a.known=Math.max(0,a.known-used);
      if(!a.unknown&&used<req.qty)shoppingNeeds[req.key]=(shoppingNeeds[req.key]||0)+(req.qty-used);
    }
   }
   meals.push({slot,recipeId:recipe.id,title:recipe.title,kind:recipe.kind,time:recipe.time,missing,uncertain,status:missing.length?"추가 구매 필요":uncertain.length?"수량 확인 필요":"재고로 가능",
     setting:{staple:basics.rice?"밥(미리 지어둔 경우)":"밥 준비 필요",dish:recipe.title,extraCooked:"없음",side:basics.kimchi?"김치":"김치 준비 필요"},
     ingredients:recipe.ingredients,seasoning:recipe.seasoning,steps:recipe.steps,tips:recipe.tips});
  }
  days.push({date:shiftDate(weekStart,d),meals});
 }
 const shopping=Object.entries(shoppingNeeds).map(([key,quantity])=>({key,name:FOOD_BY_ID[key]?.name||key,quantity:+quantity.toFixed(2),unit:FOOD_BY_ID[key]?.unit||"g"}));
 return {weekStart,days,shopping,meta:{engine:"local-rules-v1",includePlanned,generatedAt:new Date().toISOString(),note:"장보기 예산 추정이 아닌 재고 적합도 기반. 전체 상차림은 조리할 요리 한 가지와 밥·김치만 기본."}};
}
