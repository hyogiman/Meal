# Meal — Firebase 플러그인을 이용한 Codex 배포 인수인계

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
