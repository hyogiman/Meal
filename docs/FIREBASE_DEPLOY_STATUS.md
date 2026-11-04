# Meal Firebase 배포 결과 — 2026-11-04

## 완료 상태

- Firebase 프로젝트: mealplan-786a6, Blaze 활성 상태 확인.
- OPENAI_API_KEY 및 MEAL_ALLOWED_UIDS: Secret Manager 버전 1 사용 설정됨 확인. 비밀값은 조회하거나 기록하지 않음.
- analyzeInventoryPhoto와 suggestMeals: Cloud Functions v2 callable, asia-northeast3, Node.js 22, 512 MiB 배포 완료.
- 최종 배포 작업: 1793753215658, success / 100%.
- 운영 Storage 규칙은 사용자 게시본 유지: 본인 UID 경로, JPEG MIME, 파일당 최대 2 MiB, 소유자 삭제.
- Firestore 규칙, 기존 재고·구매 기록과 Pages 설정은 유지. 인증 시험 중 의도하지 않게 새로 생성된 식단 1건은 백업 후 원복함(아래 기록 참조).

## 실제 접속 도메인 수정

https://hyogiman.github.io/Meal/ 이 https://2nhyeok.kr/Meal/ 로 이동하는 기존 동작을 확인했다. 기존 Functions CORS 목록에 실제 도메인이 없어 브라우저의 AI 요청이 차단되는 문제를 재현했다.

functions/index.js의 허용 origin에 https://2nhyeok.kr 을 추가했다. 기존 origin들과 인증 및 가족 UID 허용 목록 검사는 유지했다.

수정 커밋: 09709e982f317ace3ad9e93a224e251d0765f9e0

## 검증

- node --check functions/index.js 통과.
- 미로그인/미승인 UID/잘못된 입력에 대한 로컬 guard 검사 10개 통과.
- 재배포 후 두 운영 함수 각각에 대해:
  - GitHub Pages origin OPTIONS: HTTP 204 및 정확한 Access-Control-Allow-Origin.
  - 실제 도메인 origin OPTIONS: HTTP 204 및 정확한 Access-Control-Allow-Origin.
  - 외부 테스트 origin OPTIONS: Access-Control-Allow-Origin 없음.
  - 인증 없는 POST: HTTP 401, UNAUTHENTICATED.
- 이전 로컬 Functions 에뮬레이터에서도 두 함수 로드 및 미인증 요청 거부 확인.

## 배포 이미지 보관

최초 배포는 함수 생성 후 Artifact Registry 정리 정책 자동 설정 단계에서 오류가 발생했다. 사용자가 이미지 보관을 선택했으므로 자동 삭제 정책은 만들지 않았다.

서울 gcf-artifacts 저장소의 기존 라벨을 유지하고 firebase-functions-cleanup-opted-out=true를 추가했다. 이는 설치된 Firebase CLI의 functions:artifacts:setpolicy --none이 사용하는 보관 선택 표시다. 이후 배포는 성공으로 완료되었다. 이미지 삭제, 신규 유료 스캔 활성화는 수행하지 않았다.

## 실제 로그인 AI 검증 및 수정

2026-11-04 허용 계정으로 운영 Meal에서 식단 AI를 두 차례 호출했다. 비밀값을 읽지 않고 인증·허용 UID·OpenAI 키·식단 모델의 실제 동작을 검증했다.

- 첫 호출: 서버는 HTTP 200으로 120초 이후 완료했으나, 프론트엔드가 120초에 deadline-exceeded를 표시했다.
- 식단 및 사진 callable의 브라우저 대기 시간을 270초로 조정했다(서버 제한 240초 + 네트워크 여유). 커밋: 51120952fffb1dfe1780d4e0ff2d8e0b63259cd2.
- 두 번째 호출: 앱에서 실제 7일·21끼 식단 표시를 확인했다. 재고와 구매 기록은 변경하지 않았다.
- 오늘의 식단 호출 한도 2회를 사용했으므로 추가 실제 AI 호출은 하지 않았다.

## 시험 중 의도하지 않은 저장과 원복

두 번째 응답 후 에이전트의 confirm 승인 도구 호출 없이 식단이 저장됐으며, 사용자도 확인창을 누르지 않았다고 확인했다. 기본 confirm의 처리 경위는 확정하지 않았다.

Firestore 생성·수정 시각을 확인한 결과 시험 중 새로 생성된 식단 1건이었다. 기존 문서를 덮어쓴 것은 아니었다. 해당 문서 전체를 로컬 비공개 백업한 후, 수정 시각 일치 조건으로 그 1건만 제거했다. Firestore 목록과 운영 브라우저에서 시험 전의 식단 미생성 상태를 다시 확인했다. 실제 UID와 백업 내용은 저장소에 올리지 않았다.

## 명시적 저장 UI 수정

브라우저 기본 confirm에 의존하던 경로를 제거했다. AI 응답 수신은 7일 식단 미리보기만 열며, 별도의 '검토한 식단 저장' 버튼을 눌러야 Firestore에 저장한다. 닫기·Escape는 초안을 폐기한다. 요청 당시 계정과 저장 시 계정이 다르면 저장하지 않는다.

실제 표시에서 발견한 주간 부족 재료 집계 누락도 수정했다. 각 끼니의 부족 재료를 이름·단위별로 합산하여 요약과 장보기에서 사용할 수 있게 했다.

- 구현 커밋: 1d829757cbe5f392d9294317988132ff9152c3ef.
- 회귀 검사: tests/ai-plan-review.cjs, 테스트 커밋 d7b754784b6dc0d8ebf20b59571bfa0894321493.
- 검사 통과: 응답만 받으면 쓰기 없음, 21끼 미리보기, 계정 변경 차단, 저장 실패 복구, 명시적 저장, 부족량 합산, 중복 저장 차단, 인라인 JavaScript 문법.
- Firebase/OpenAI와 연결하지 않은 로컬 브라우저에서도 미리보기 열기 → 저장하지 않고 닫기 → 식단 미생성을 확인했다.
- 운영 HTML에서 새 미리보기·저장 버튼과 기존 confirm 제거를 확인했다. 한도 때문에 수정 후 추가 실제 API 호출은 하지 않았다.

## 남은 검증 범위

사진 AI의 실제 이미지 인식과 Storage 파일 업로드는 아직 종단 간 시험하지 않았다. Storage 규칙은 게시 상태·정적 검토까지 확인했으며, 사진 기능의 실제 성공을 의미하지 않는다. 식단의 영양값·재료량·맛·조리 적합성에 대한 전체 검수도 별도다.
