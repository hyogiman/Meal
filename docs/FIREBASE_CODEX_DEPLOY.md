# Meal — Firebase 플러그인을 이용한 Codex 배포 인수인계

## 메뉴와 장보기 우선 — 2026-11-09

- 주간 예산은 새로운 식재료와 다양한 요리를 위한 목표 상한이다. 냉장고 재료만으로 메뉴를 제한하거나 최소 지출을 목표로 하지 않는다.
- 서버는 주간 점심·저녁의 주재료 계열 5종 이상, 조리법 4종 이상, 서로 다른 메뉴 10개 이상을 검사한다. 한 주재료 계열은 최대 4끼, 달걀·참치캔/가공육은 각각 최대 2끼다. 한 끼 후보 3개도 주재료 계열과 조리법이 서로 달라야 한다.
- 미리보기와 저장 식단에 새 주재료, 추가 수량, 채소·양념 및 입력 가격 소계를 표시한다. 미확인 판매가는 생성하지 않는다. 가격 미확인 품목이 있으면 예산 충족 판정을 보류한다.
- 재고는 장보기 차감에만 사용하며 저장 전 초안과 실제 재고는 변경하지 않는다. 기존 식단은 자동 재생성하지 않는다.

## 현재 사용자 요구와 운영 상태 — 2026-11-08

- 사용자 정정 반영: AI로 주간 21끼를 만들고, 마음에 안 드는 끼니만 AI 후보 3개로 교체한다. 주간 식단 없이도 후보를 받아 원하는 날짜에 배치할 수 있다. 내장 레시피 생성도 보조 버튼으로 유지한다.
- 주간 저장은 명시적 버튼과 기존 식단 교체 체크를 사용하며, 미리보기 이후 다른 기기에서 식단을 변경하면 덮어쓰기를 거절한다. 재고 입력과 병행 가능하며 재고 수량을 수정하지 않는다.
- 주재료 중심의 다양성, 양념·향신재료의 개별 계량과 부족분 반영, 최근 추천 제목 참고를 적용한다.
- 사진 인식·사진 첨부는 제거했다. 기존 파일과 재고 데이터를 삭제하지 않는다.
- AI 주간 요청은 mode=weekly, startDate, servings, maxMinutes, avoidTitles이다. 한 끼 요청은 mode=single, date, slot, servings, maxMinutes, style, avoidTitles이다. 주간 14개 레시피를 서버가 7일 21끼로 펼치고 중복 배치를 검사한다. 주간 응답 최대 14000토큰, 단일 5000토큰이며 서버 540초·주간 클라이언트 570초 제한이다.
- 후보 선택 후 명시적인 '선택한 한 끼 반영' 버튼으로 해당 날짜·끼니만 저장한다. 다른 끼니를 보존하기 위해 Firestore transaction에서 최신 주간 문서를 읽고 합친다.
- 기존 Firestore 규칙의 days.size()==7을 유지한다. 주간 날짜 7개에 미등록 meals 배열을 비워 두므로 규칙 변경이 필요 없다.
- 식단 AI의 일일 횟수 제한은 사용자 요청으로 제거했다. 인증·가족 UID 허용 목록과 maxInstances는 유지한다.
- 인원별 재료량·탄단지·칼로리 재계산 및 탄수화물 비중 안내를 제공한다. 영양자료가 없거나 단위를 환산할 수 없는 재료는 미반영으로 표시한다.
- 운영 앱에서 실제 한 끼 후보 응답과 저장하지 않고 닫기를 확인했다. 저장·교체는 운영 데이터 대신 로컬/모의 테스트로 검증했다.
- 테스트: node tests/ai-plan-review.cjs, node tests/function-quota.cjs.
- 최신 근거와 제한사항은 [배포 상태](FIREBASE_DEPLOY_STATUS.md)를 우선 참고한다.

아래는 최초 연결 당시 인수인계 기록이다. 사진 기능과 주간 AI 생성에 관한 과거 체크리스트보다 위의 현재 요구가 우선한다.

## 이미 끝난 작업
- 저장소: https://github.com/hyogiman/Meal
- 운영 페이지: https://hyogiman.github.io/Meal/
- 기존 Firebase: mealplan-786a6
- 사용자 확인: 이메일/비밀번호 로그인, 승인 도메인, Firestore 규칙 게시, 앱 연결 진단 성공
- 본인 계정 데이터는 users/{uid}/inventory, purchases, wishlist, plans, settings, events 경로를 사용함

## Codex에서 최초 실행

1. **Codex**를 열고 GitHub 저장소 **hyogiman/Meal**을 작업 대상으로 선택합니다.
2. Plugins에서 **Firebase** 플러그인이 활성화됐는지 확인합니다. 설치돼 있더라도 Codex 환경에서 승인/재연결을 요구할 수 있습니다.
3. Codex에 아래 지시를 전달합니다. 반드시 **기존 프로젝트** mealplan-786a6에 연결하고, 새 Firebase 프로젝트를 생성하지 않습니다.

### Codex에 보낼 명령

> @Firebase 프로젝트는 기존 GitHub hyogiman/Meal, Firebase mealplan-786a6입니다.
> AGENTS.md와 docs/FIREBASE_CODEX_DEPLOY.md를 읽고 현재 Firebase 계정의 프로젝트/Firestore Rules/Storage/Functions 상태를 먼저 조회해 주세요.
> Firestore에서 users/{uid} 아래 실제 데이터가 있다는 가정을 바탕으로 접근 규칙을 비교 검증하고, 현재 성공하는 로그인 및 재고 기록을 깨지 마세요.
> Cloud Storage 버킷 및 이미지 업로드 Rules를 점검하고, Functions의 analyzeInventoryPhoto와 suggestMeals를 배포 가능한지 확인해 주세요.
> OPENAI_API_KEY는 Secret Manager에만 보관하고 공개 GitHub에는 올리지 않습니다.
> Firebase Functions가 아직 없으면 먼저 dry-run/에뮬레이터로 확인한 뒤 배포 전 승인 요청해 주세요.
> GitHub Pages https://hyogiman.github.io/Meal/ 주소는 유지하고 Firebase Hosting으로 바꾸지 마세요.
> 변경된 코드와 테스트 결과를 GitHub에 커밋하고, 실제 배포 성공/실패를 명확히 보고해 주세요.

### 공식 Codex 플러그인
- Firebase 공식 설치 안내: https://firebase.google.com/docs/ai-assistance/build-with-ai
- Codex 터미널 플러그인: \`codex plugin marketplace add firebase/agent-skills\` 이후 \`codex plugin add firebase@firebase\`
- Codex 앱에서는 Plugins에서 Firebase를 설치하고 \`@Firebase\`를 선택할 수 있습니다.

## 배포 대상 구분
- **GitHub Pages UI:** main/index.html 커밋 시 기존 URL에서 제공
- **Firebase 백엔드:** firestore.rules, storage.rules, functions/index.js 등은 GitHub에 커밋만 해서는 배포되지 않음
- **Functions:** \`firebase deploy --only functions:meal --project mealplan-786a6\`
- **Storage Rules:** \`firebase deploy --only storage --project mealplan-786a6\` (Storage 버킷 생성 및 규칙 감사 후)
- **Firestore Rules:** \`firebase deploy --only firestore:rules --project mealplan-786a6\` (실서버 규칙과 비교/테스트 후)

## GitHub Actions 선택적 배포
\`.github/workflows/firebase-backend.yml\`은 자격증명이 없으면 배포하지 않습니다. Workload Identity Federation을 사용해 연결하면 GitHub Actions → Firebase로 코드를 배포할 수 있습니다. 서비스 계정 JSON 키나 FIREBASE_TOKEN을 공개 GitHub에 올리지 않습니다.

- **Repository variables:** MEAL_FIREBASE_WIF_PROVIDER, MEAL_FIREBASE_SERVICE_ACCOUNT
- Google Cloud에 GitHub \`hyogiman/Meal\` 저장소와 main 브랜치만 허용하는 WIF 제공자를 생성·연결하고, 배포 서비스 계정에는 최소한의 배포 관련 IAM 권한만 부여합니다.
- 이 초기 작업은 Codex Firebase 플러그인이 접근 가능한 사용자 승인 환경에서 수행합니다. 이 ChatGPT 대화에서는 Firebase 관리자 API를 직접 실행할 수 없습니다.
- Firebase CLI를 통한 Rules 배포는 Firebase Console의 기존 규칙을 **덮어쓰므로**, 최초 배포 시 반드시 live Rules와 비교합니다.

## 현재 단계에서 요청할 사용자 승인
- 저장소와 Firebase 프로젝트 연결 권한 승인
- Cloud Storage 생성이 필요한 경우 Blaze 과금/리전 검토
- Cloud Functions 배포 및 OpenAI API 사용에 따른 과금 동의
- OpenAI API 비밀키는 Codex/Secret Manager에서 안전하게 설정하며 대화나 GitHub에 붙여넣지 않음

## 검증 체크리스트
1. Firebase CLI 프로젝트 ID가 **mealplan-786a6**인지 확인
2. 현재 로그인 사용자와 Firestore 소유자 경로/Rules 일치
3. Functions가 asia-northeast3에 생성되어 있는지
4. 로그인 없는 함수 호출은 거부되는지
5. 본인 계정 사진에서 **인식 후보**만 반환되는지, 확정 전 재고 수정이 없는지
6. AI 식단 출력이 7일 21끼인지, 미역만둣국 같은 생소한 조합을 기본 추천하지 않는지
7. 기존 장보기 가계부 기록과 재고를 변경하지 않았는지
8. Cloud Functions 로그의 예상 모델 호출 비용과 실패 건수 검토


## 유료 AI 함수 사용 승인(필수)
- Cloud Functions 배포 전 Firebase Secret Manager에 `OPENAI_API_KEY`와 **`MEAL_ALLOWED_UIDS`**를 등록하세요.
- `MEAL_ALLOWED_UIDS` 값은 사용 승인된 가족 계정의 Firebase Authentication **UID를 쉼표로 연결**한 문자열입니다. 코드나 GitHub에 실제 UID 값을 적지 마세요.
- 이 허용 목록에 없는 사용자는 로그인했더라도 유료 OpenAI 함수 호출이 거부됩니다. 현재 웹앱에서는 누구나 새 계정을 만들 수 있으므로 비용 보호에 필요합니다.
- Secret Manager에 값이 없으면 함수가 정상 배포·실행되지 않을 수 있습니다.
- 실제 Firebase Rules를 감사하기 전에는 `firestore.rules`를 자동 배포하지 마세요. GitHub의 Rules는 제안본일 뿐입니다.
