# Meal v2 — 우리 집 식탁 매니저

**GitHub Pages:** https://hyogiman.github.io/Meal/  
**Firebase project:** `mealplan-786a6`  
**현재 배포:** `main/index.html` · 이전 버전은 [legacy.html](./legacy.html)

## 2026-11-03 연결 상태

- ✅ GitHub `main/index.html`을 **Firebase v2 앱으로 교체 완료**. 로그인·재고·구매·식단 UI 코드를 포함합니다.
- ✅ 사용자가 **Firebase Authentication의 이메일/비밀번호 로그인 활성화**, **Authorized domains 등록**, **Firestore 보안 규칙 게시**를 완료했다고 알려주셨습니다.
- ✅ Firebase의 웹 설정(`apiKey`, `projectId`, `appId` 등)은 제공받은 `mealplan-786a6` 정보가 포함되어 있습니다.
- ⚠️ **실제 사용자 로그인 및 Firestore 실시간 읽기·쓰기는 아직 사용자가 브라우저에서 검증해야 합니다.** 이 연결은 자격 증명 없이 원격에서 대신 확인할 수 없습니다.
- ⚠️ GitHub Pages CDN 게시 상태와 실제 외부 접속은 이 실행 환경에서 직접 검증되지 않았습니다.
- ⏳ **사진 AI · OpenAI 기반 새 식단**은 Cloud Functions, Secret Manager 및 별도 OpenAI API 배포가 필요해 아직 작동하지 않습니다.
- ⏳ **식재료 사진을 Firebase Storage에 저장**하려면 Storage 버킷과 해당 Storage 규칙 활성화도 필요합니다.

## 실연결 확인: 앱에서 직접 진단

1. [Meal 앱](https://hyogiman.github.io/Meal/)을 엽니다. 이전 화면이 보이면 **새로고침**해 주세요.
2. 상단 **로그인**에서 Firebase 이메일/비밀번호로 로그인합니다. Authentication 공급자만 켠 상태에서 아직 계정이 없다면 **새 계정 만들기**를 먼저 누릅니다.
3. 하단 **설정** → **🔎 Firebase 읽기·쓰기 연결 진단**을 누릅니다.
4. 성공이면 **Firestore에 본인 계정용 임시 문서를 생성 → 읽기 → 삭제**했다는 메시지가 표시됩니다.
5. **냉장고**에서 재료 하나 등록 → 새로고침 → 다른 기기에서 **같은 Firebase 계정**으로 로그인해 재고를 확인합니다.

**중요:** 연결 테스트는 로그인한 사용자의 `users/{uid}/settings/__connection_check_{id}`에 임시 문서를 만듭니다. 기존 재고·구매·식단을 덮어쓰지 않습니다. Firebase 규칙으로 읽기/쓰기가 허용돼야 통과합니다. 생성 후 즉시 삭제하며, 실패 시 삭제 재시도 안내가 나옵니다.

## 연결 오류 확인 순서

| 앱의 메시지 | 주로 확인할 부분 |
|---|---|
| Firebase SDK를 불러오지 못함 | 네트워크, 브라우저 광고/보안 확장, CDN 연결 |
| 이메일 또는 비밀번호가 맞지 않음 | 로그인 계정 존재, 이메일/비밀번호, 계정 만들기 필요 여부 |
| Authentication에서 해당 방법 활성화 요청 | Email/Password 공급자 |
| Unauthorized domain | `hyogiman.github.io`가 Firebase 인증의 Authorized domains에 있는지 |
| permission-denied | **현재 로그인 사용자 UID**와 Firestore Rules의 `users/{uid}` 하위 경로 일치 여부 |
| unavailable / 데이터베이스 없음 | Firestore Database가 실제 생성·활성화되었는지 |
| Storage 인증·권한 오류 | Storage 생성 여부 및 별도 `storage.rules` 게시 |
| AI 함수 사용 불가 | Cloud Functions + `OPENAI_API_KEY` Secret 미배포 |

## v2 기능

- 냉장고 재고: 식품명·수량·중량·단위·위치·유통기한·메모·사진
- 실제 구매확정 → 구매금액 기록 및 재고 입고, 재고 사용·폐기 이력
- 밥/김치 외의 새 국·반찬을 **자동으로 준비됐다고 가정하지 않는** 규칙기반 일주일 21끼 메뉴, 각 조리법·양념·재료량·전체 조리시간
- 품목 부족 시 미구매 목록으로, 메뉴가 마음에 들지 않으면 한 끼 교체
- 개인 사용자 단위 Firestore 데이터 동기화, 예산 관리, JSON/CSV 백업·복원
- 실제 AI 추천 및 사진 인식은 *Cloud Functions 배포 후* 활성화되는 설계

## 보안

Firebase 웹 설정 키는 공식 문서에서 설명하는 **공개 앱 설정값**입니다. **OpenAI API 비밀키나 Firebase 서비스 계정 키를 웹 파일/공개 GitHub에 올리지 마세요.** Firestore Rules를 통해 로그인한 본인 UID의 문서만 접근하도록 해야 합니다.

기기 모드의 데이터는 Firebase로 자동 이전되지 않습니다. 필요하면 설정의 JSON 백업/복원 기능을 사용하세요. 다른 가족 계정끼리 공용 재고 공유 기능은 아직 구현 전입니다.

## Codex와 Firebase 배포 준비 현황 (2026-11-03)

- **GitHub에 백엔드 배포용 파일 준비 완료:** `functions/index.js`, `functions/package.json`, `storage.rules`, `firebase.json`, `.firebaserc`
- **Codex 인수인계:** [AGENTS.md](./AGENTS.md), [Firebase 배포 절차](./docs/FIREBASE_CODEX_DEPLOY.md)
- **배포 워크플로:** [Firebase Backend Action](./.github/workflows/firebase-backend.yml) — 안전을 위해 수동 실행만 가능, Google Cloud Workload Identity Federation 연결 전에는 배포 불가
- **유료 AI 안전장치:** 로그인이 필요하고 사용 허용된 Firebase UID만 AI를 호출하도록 `MEAL_ALLOWED_UIDS` Secret 검증, 각 UID별 일일 횟수 제한
- **주의:** 이 업데이트는 **코드 배포 준비**입니다. Firebase 프로젝트의 Cloud Functions·Storage를 실제로 배포한 것은 아닙니다. 이미 성공한 로그인·Firestore 사용 상태는 그대로 유지합니다. 현재 라이브 Rules는 Codex Firebase 플러그인에서 비교 검증하기 전에는 덮어쓰지 않습니다.
