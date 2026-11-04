# Meal Firebase 배포 결과 — 2026-11-04

## 완료 상태

- Firebase 프로젝트: mealplan-786a6, Blaze 활성 상태 확인.
- OPENAI_API_KEY 및 MEAL_ALLOWED_UIDS: Secret Manager 버전 1 사용 설정됨 확인. 비밀값은 조회하거나 기록하지 않음.
- analyzeInventoryPhoto와 suggestMeals: Cloud Functions v2 callable, asia-northeast3, Node.js 22, 512 MiB 배포 완료.
- 최종 배포 작업: 1793753215658, success / 100%.
- 운영 Storage 규칙은 사용자 게시본 유지: 본인 UID 경로, JPEG MIME, 파일당 최대 2 MiB, 소유자 삭제.
- Firestore 규칙과 기존 재고·구매·식단 데이터, Pages 설정은 변경하지 않음.

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

## 남은 사용자 기능 검증

검증용 브라우저는 Meal 로그인이 필요하다. 허용 계정 로그인 후 실제 AI 응답, 7일 21끼 결과, 사진 후보 반환 및 Storage 업로드 성공 여부를 확인해야 한다. OpenAI 키의 유효성·모델 접근 권한과 MEAL_ALLOWED_UIDS 값의 정확성은 아직 실제 인증 호출로 검증하지 않았다.

실제 테스트 전까지 AI 기능 전체의 종단 간 성공으로 간주하지 않는다. 테스트용으로 기존 재고나 식단을 임의로 생성·수정하지 않는다.
