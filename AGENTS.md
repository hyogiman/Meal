# Meal — Codex / Firebase 개발 지침

## 프로젝트 경계
- GitHub: https://github.com/hyogiman/Meal / main
- 공개 프론트엔드: https://hyogiman.github.io/Meal/ (GitHub Pages)
- Firebase 프로젝트: **mealplan-786a6** / Functions region **asia-northeast3**
- OpenAI SDK API 모델: 주간 식단 및 한 끼 메뉴 후보 gpt-6.1-terra. 사용자 요청으로 사진 인식·첨부는 제거했다.
- 사용자 계정으로 Firebase 이메일/비밀번호 로그인 및 Firestore 읽기·쓰기 연결 진단은 이미 성공했다고 사용자에게 확인받음.
- GitHub root index.html은 현재 운영 중인 Meal v2. legacy.html과 v2/ 하위 파일은 **백업/별도 기존 기능**. 삭제하지 말 것.

## 현재 우선순위
1. 공식 Firebase 플러그인 (@Firebase)으로 현재 프로젝트 설정, 실제 Firestore 보안 규칙, Storage 버킷 상태를 **읽어서 검사**한다.
2. repo의 firestore.rules가 실제 Firestore 구조와 맞는지 확인한다. **현행 규칙을 확인 없이 덮어쓰지 않는다**.
3. 사진 기능을 다시 노출하지 않는다. 기존 Storage 파일과 규칙은 별도 요청 없이 삭제·변경하지 않는다.
4. suggestMeals는 mode=weekly로 7일 21끼, mode=single로 한 끼 후보 3개를 생성한다. 기존 analyzeInventoryPhoto는 종료 안내만 반환한다. 로그인 및 허용 UID 검사를 유지한다. 사용자는 Blaze·OpenAI 비용과 배포를 승인했으며 식단 AI 일일 횟수 제한 제거를 요청했다.
5. 주간 전체 생성(AI 기본, 내장 21끼 보조)과 독립적인 AI 후보 3개 추천을 함께 제공한다. 주간 생성은 미리보기 후 명시적 저장, 기존 주간 교체는 체크 동의 및 동시 변경 검사를 거친다. 비교는 중첩 객체 키를 정렬하고 배열 순서를 유지해 Firestore 맵 순서 차이를 오탐하지 않는다. 실제 충돌 시 초안을 유지하고 최신 저장본 확인·재동의 후 저장을 재시도한다. 끼니별 다시 추천은 해당 끼니만 교체한다. 후보를 본 뒤 적용 날짜·끼니를 바꿀 수 있다. 기본 confirm 자동 처리에 의존하지 않고 재고 수량을 변경하지 않는다.
6. 식단은 밥/김치 외에 만들어진 음식이 있다고 가정하지 않는다. 국·반찬은 **별도의 조리시간과 재료**가 필요하다.
7. AI는 주간 예산으로 새 식재료와 먹고 싶은 메뉴를 먼저 계획한다. 재고는 구매량 차감용이며 메뉴 제한 목록이 아니다. 점심·저녁에 주재료 계열 5종 이상·조리법 4종 이상·서로 다른 메뉴 10개 이상을 검사한다. 한 계열 최대 4끼, 달걀과 참치캔·가공육은 각각 최대 2끼다. 미등록 양념 때문에 메뉴를 제한하지 않고 실제 필요한 양념·향신재료를 각각 계량하여 부족분에 포함한다. 최근 메뉴를 요청에 전달하고 주간 중복을 검사한다.
8. 정확한 구매가격 없이 예산과 최종 결제 금액을 꾸며내지 않는다. 새 주재료, 추가 구매량, 양념 부족분을 미리보기와 저장한 식단에 표시한다. 장보기 목록의 입력 수량·가격을 구매 묶음으로 올림 계산한 소계와 미확인 품목 수를 구분하고, 미확인 가격이 있으면 예산 충족 여부를 단정하지 않는다.

- 장보기 추가는 주간·개별 메뉴·후보에서 재료 체크 후 명시적으로 실행한다. 기본 미선택, 취소 시 무쓰기, 이미 목록에 있는 재료 중복 방지, 제출 시 최신 재고 차감을 유지한다.

- 주간 메뉴판은 `#menu` 경로로 별도 제공한다. 저장된 레시피만 표시하고 메뉴판 열기·주 이동 시 AI 호출이나 데이터 쓰기를 하지 않는다.
- 네이티브 `confirm`/`alert`/`prompt`를 다시 도입하지 않는다. `askConfirmation`은 비동기 모달이며 취소·닫기·계정 변경 시 false다.

## 보호 규칙
- FIREBASE_SERVICE_ACCOUNT JSON, OpenAI API key, .env 또는 service-account key는 공개 저장소에 커밋하지 않는다.
- Firebase client apiKey는 공개 앱 식별용 설정이고 OpenAI API key와 다르다.
- 변경 전: 기존 사용자 데이터/권한/규칙 백업 및 영향 확인. 프로덕션 Rules와 Functions 배포는 검증 후 진행.
- Firebase Hosting으로 이전하지 말 것 (현재 GitHub Pages 주소 유지).
- 기존 사용자 데이터 임의 시드·가짜 구매/재고 생성 금지.
- 기능 추가 시 index.html 동작을 보존하고 관련 테스트 실행.
- 요청사항이 불확실하면 README와 docs/FIREBASE_CODEX_DEPLOY.md 참고.

## 코드 구조
- index.html: GitHub Pages 서비스 중인 독립 실행 HTML.
- functions/index.js: 서버 측 OpenAI API Gateway (onCall)
- functions/package.json: Node 22 함수 의존성
- firebase.json + .firebaserc: 기존 프로젝트에 한정한 배포 설정
- firestore.rules: **배포 전 실서버 규칙과 반드시 비교**
- storage.rules: Firebase Storage 사진 업로드 보안 규칙
- .github/workflows/firebase-backend.yml: 관리자가 한 번 인증 설정한 뒤 수동 실행할 수 있는 배포 파이프라인

## 로컬 점검
- node --check functions/index.js
- node --check v2/recipes.js
- GitHub Pages 운영 화면 확인: 로그인 → Firestore 연결 진단 → 냉장고에서 수량 등록/수정 → 다른 기기 동기화
- node tests/function-quota.cjs, node tests/ai-plan-review.cjs, node tests/plan-shopping.cjs, node tests/menu-modal.cjs
- 실제 AI 시험은 후보 확인 후 닫기까지 수행한다. 운영 식단을 시험용으로 임의 저장하지 않는다.
- 영양정보는 재료 기반 추정치다. 재료량 기준(내장 2인분 / AI 요청 인원 전체)을 구분하고 미확인 재료는 표시한다. 탄수화물 65% 초과 안내는 참고용이며 자료가 불완전하면 판정을 보류한다.

## 유료 AI 함수 사용 승인(필수)
- Cloud Functions 배포 전 Firebase Secret Manager에 `OPENAI_API_KEY`와 **`MEAL_ALLOWED_UIDS`**를 등록하세요.
- `MEAL_ALLOWED_UIDS` 값은 사용 승인된 가족 계정의 Firebase Authentication **UID를 쉼표로 연결**한 문자열입니다. 코드나 GitHub에 실제 UID 값을 적지 마세요.
- 이 허용 목록에 없는 사용자는 로그인했더라도 유료 OpenAI 함수 호출이 거부됩니다. 현재 웹앱에서는 누구나 새 계정을 만들 수 있으므로 비용 보호에 필요합니다.
- Secret Manager에 값이 없으면 함수가 정상 배포·실행되지 않을 수 있습니다.
- 실제 Firebase Rules를 감사하기 전에는 `firestore.rules`를 자동 배포하지 마세요. GitHub의 Rules는 제안본일 뿐입니다.
