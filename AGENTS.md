# Meal — Codex / Firebase 개발 지침

## 프로젝트 경계
- GitHub: https://github.com/hyogiman/Meal / main
- 공개 프론트엔드: https://hyogiman.github.io/Meal/ (GitHub Pages)
- Firebase 프로젝트: **mealplan-786a6** / Functions region **asia-northeast3**
- OpenAI SDK API 모델: 한 끼 메뉴 후보 gpt-6.1-terra. 사용자 요청으로 사진 인식·첨부는 제거했다.
- 사용자 계정으로 Firebase 이메일/비밀번호 로그인 및 Firestore 읽기·쓰기 연결 진단은 이미 성공했다고 사용자에게 확인받음.
- GitHub root index.html은 현재 운영 중인 Meal v2. legacy.html과 v2/ 하위 파일은 **백업/별도 기존 기능**. 삭제하지 말 것.

## 현재 우선순위
1. 공식 Firebase 플러그인 (@Firebase)으로 현재 프로젝트 설정, 실제 Firestore 보안 규칙, Storage 버킷 상태를 **읽어서 검사**한다.
2. repo의 firestore.rules가 실제 Firestore 구조와 맞는지 확인한다. **현행 규칙을 확인 없이 덮어쓰지 않는다**.
3. 사진 기능을 다시 노출하지 않는다. 기존 Storage 파일과 규칙은 별도 요청 없이 삭제·변경하지 않는다.
4. suggestMeals는 mode=single 요청에서 한 끼 후보 3개만 생성한다. 기존 analyzeInventoryPhoto는 종료 안내만 반환한다. 로그인 및 허용 UID 검사를 유지한다. 사용자는 Blaze·OpenAI 비용과 배포를 승인했으며 식단 AI 일일 횟수 제한 제거를 요청했다.
5. 주간 전체 생성(재고 기반 내장 21끼)과 독립적인 AI 후보 3개 추천을 함께 제공한다. 주간 생성은 미리보기 후 명시적 저장, 기존 주간 교체는 체크 동의 및 동시 변경 검사를 거친다. 끼니별 다시 추천은 해당 끼니만 교체한다. 후보를 본 뒤 적용 날짜·끼니를 바꿀 수 있다. 기본 confirm 자동 처리에 의존하지 않고 재고 수량을 변경하지 않는다.
6. 식단은 밥/김치 외에 만들어진 음식이 있다고 가정하지 않는다. 국·반찬은 **별도의 조리시간과 재료**가 필요하다.
7. 정확한 구매가격 없이 예산과 최종 결제 금액을 꾸며내지 않는다.

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
- node tests/function-quota.cjs 및 node tests/ai-plan-review.cjs
- 실제 AI 시험은 후보 확인 후 닫기까지 수행한다. 운영 식단을 시험용으로 임의 저장하지 않는다.
- 영양정보는 재료 기반 추정치다. 재료량 기준(내장 2인분 / AI 요청 인원 전체)을 구분하고 미확인 재료는 표시한다. 탄수화물 65% 초과 안내는 참고용이며 자료가 불완전하면 판정을 보류한다.

## 유료 AI 함수 사용 승인(필수)
- Cloud Functions 배포 전 Firebase Secret Manager에 `OPENAI_API_KEY`와 **`MEAL_ALLOWED_UIDS`**를 등록하세요.
- `MEAL_ALLOWED_UIDS` 값은 사용 승인된 가족 계정의 Firebase Authentication **UID를 쉼표로 연결**한 문자열입니다. 코드나 GitHub에 실제 UID 값을 적지 마세요.
- 이 허용 목록에 없는 사용자는 로그인했더라도 유료 OpenAI 함수 호출이 거부됩니다. 현재 웹앱에서는 누구나 새 계정을 만들 수 있으므로 비용 보호에 필요합니다.
- Secret Manager에 값이 없으면 함수가 정상 배포·실행되지 않을 수 있습니다.
- 실제 Firebase Rules를 감사하기 전에는 `firestore.rules`를 자동 배포하지 마세요. GitHub의 Rules는 제안본일 뿐입니다.
