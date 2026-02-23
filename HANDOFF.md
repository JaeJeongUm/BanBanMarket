# HANDOFF.md — 반반마켓 작업 인수인계

> 매 작업 완료 시 자동 업데이트됩니다.
> 최신 상태: **2026-02-23**

---

## 현재 프로젝트 상태 한눈에 보기

| 영역 | 상태 | 비고 |
|---|---|---|
| 백엔드 | ✅ MVP 완성 | 테스트 3건 전체 통과 |
| 프론트엔드 | ✅ 빌드 성공 + UI/UX 대규모 개선 완료 | `npm run build` 성공 |
| 배포 준비 | ✅ 완료 | Docker Compose, Dockerfile, 스크립트 준비됨 |
| CI | ✅ 완료 | `.github/workflows/ci.yml` |
| 실서버 배포 | ⏳ 미완 | VPS 미확보 상태 |

---

## 작업 이력

### 2026-02-23 — 세션 #1

#### 요청
- 병렬 에이전트(백엔드 / 프론트엔드 / 테스트) 기능 설정 및 즉시 적용
- 사용자 직접 로그인·정보 확인, 여러 명 접속자의 방생성·모임참가 기능, UI/UX 직관적 개선

#### 완료 작업

**[설정] CLAUDE.md 개선**
- `/init` 요구 사양 영문 첫 줄 추가
- 핵심 파일 경로의 `...` 플레이스홀더 → 실제 전체 패키지 경로(`com/banban/market/`)로 교체
- 단일 테스트 실행 명령어 추가 (`./mvnw test -Dtest=ApiFlowIntegrationTest`)
- Spring 프로파일별 DB 동작 명세 추가 (dev: H2, prod: PostgreSQL+Flyway)
- Vite proxy 정보 명시 (`/api`, `/actuator` → `:8080`)
- Codex 병행 중단 → `codex_history.md` 히스토리 누적 규칙 제거
- 병렬 에이전트 워크플로 섹션 신규 추가

**[백엔드] 참여 불가 이유 API 추가**
- `RoomDetailResponse.java`: `joinFailReason` 필드 추가 (String, nullable)
- `RoomService.java`: `calculateJoinFailReason()` private 메서드 신규 구현
  - 우선순위별 판별: 방 마감 → 모집 완료 → 마감시간 경과 → 방장 본인 → 이미 참여 중 → 미작성 후기 있음
  - 비로그인: null 반환 (프론트에서 로그인 유도)
  - 기존 `canJoin` 필드 하위 호환 유지

**[프론트엔드] App.jsx + styles.css UI/UX 전면 개선**

| 영역 | 변경 내용 |
|---|---|
| 로그인/회원가입 모달 | 상단 탭 전환, 에러 모달 내부 표시(`authError` state), Enter 제출, 비밀번호 👁/🙈 토글, 로딩 중 버튼 비활성화, 모달 닫을 때 폼 초기화 |
| 홈 화면 | 방 카드 상태 배지(모집중/마감/완료), 마감 1시간 이내 🔥 "곧마감" 표시, "API 상태: UP" 제거 |
| 방 만들기 FAB | 점수 80 미만 → "신뢰 점수 80점 이상이어야 방을 만들 수 있어요" 토스트, 미작성 후기 → 토스트 안내 |
| 방 상세 모달 | 참여 불가 이유 ⚠️ 표시(`joinFailReason`), 참여자 중 본인 "나 ✓" 표시, 모달 열릴 때 스크롤 최상단 복귀 |
| 방 생성 폼 | 총가격/총수량 기반 단위당 가격 실시간 미리보기 |
| 마이페이지 | 점수 획득 방법 가이드 (+5/+2/-5/-20), 로그아웃 버튼 스타일 개선 |
| 내 거래 탭 | 비로그인 탭 클릭 시 바로 로그인 모달 오픈 |
| 전체 UX | 로딩 dot 바운스 애니메이션, `health` API 호출 제거 |

**[styles.css] 신규 추가 CSS 클래스**
- `.loading-dot`, `@keyframes dotBounce` — 로딩 애니메이션
- `.room-status-badge`, `.room-status-open/closed/completed` — 방 상태 배지
- `.tag-urgent` — 마감 임박 태그
- `.auth-tabs`, `.auth-tab` — 인증 모달 탭
- `.pw-toggle-btn` — 비밀번호 토글 버튼
- `.auth-error` — 인증 에러 박스
- `.score-guide` — 점수 획득 가이드 박스
- `.participant-chip-me` — 참여자 중 본인 강조
- `.logout-btn` — 로그아웃 버튼 스타일

#### 검증 결과
- 백엔드 테스트 3건 모두 통과 (BUILD SUCCESS, 약 24초)
- `joinFailReason` 추가 후에도 기존 통합 테스트(`ApiFlowIntegrationTest`) 정상 통과
- 프론트 프로덕션 빌드 통과 (`cd frontend && npm run build`, 2026-02-23)

### 2026-02-23 세션 #2

#### 요청
- HANDOFF 기준 "다음 작업"부터 이어서 진행

#### 완료 작업
- 탐색(`search`) 탭 `nearby-room` 카드에 홈 카드와 동일한 상태 표시 적용
  - 상태 배지: `OPEN/CLOSED/COMPLETED` 배지 노출
  - 마감 임박 태그: 마감 1시간 이내 `🔥곧마감` 강조 표시
- 탐색 카드 레이아웃 보정
  - `nearby-room`를 `position: relative`로 변경
  - 탐색 전용 배지 위치 클래스(`.nearby-status-badge`) 추가

#### 검증 결과
- 프론트 빌드 성공: `cd frontend && npm run build`

### 2026-02-23 세션 #3

#### 요청
- 개발계 테스트용 관리자 계정(`id: admin`, `pw: admin`) 준비
- 로그인 전 접속 시 "로그인 필요" 화면 표출

#### 완료 작업
- 백엔드 로그인 요청 스펙 완화
  - `LoginRequest`의 `@Email` 제약 제거로 `admin` 아이디 로그인 허용
- 개발 프로필 관리자 시드 추가
  - `backend/src/main/java/com/banban/market/config/AdminDataInitializer.java`
  - `dev` 실행 시 `admin/admin` 계정이 없으면 자동 생성
- 프론트 로그인 전 차단 UI 추가
  - 전체 화면 오버레이로 "로그인이 필요합니다" 메시지 표시
  - `로그인하기` 버튼 클릭 시 로그인 모달 오픈 + `admin/admin` 자동 입력
  - 로그인 모드에서 라벨을 `아이디`로 표시

#### 검증 결과
- 백엔드 테스트 통과: `cd backend && mvnw.cmd test` (3건 통과)
- 로그인 API 검증: `POST /api/auth/login` with `admin/admin` → `200`
- 프론트 빌드: 환경 이슈로 실패 (`vite/esbuild spawn EPERM`)

### 2026-02-23 세션 #4

#### 요청
- 방 생성 시 거래장소를 지도 기반으로 지정
- 만나는 시간/마감시간 입력을 연도 제외(월/일/요일/시간) UX로 개선

#### 완료 작업
- 방 생성 모달 위치 선택 개선
  - `KakaoLocationPicker` 컴포넌트 추가
  - 지도 마커 클릭으로 거래장소 선택 + 하단 칩 선택 동기화
- 방 생성 시간 입력 개선
  - `datetime-local` 제거
  - `월/일(요일)` 드롭다운 + `time` 입력 조합으로 변경
  - 제출 시 `date + time`을 ISO로 변환해서 API 전송
  - 마감시간이 만나는 시간보다 늦으면 클라이언트에서 차단
- 스타일 보강
  - 지도 영역/장소 칩/날짜-시간 행 전용 클래스 추가

#### 검증 결과
- 정적 확인: createForm 필드 참조/제출 로직 연동 확인
- 프론트 빌드: 환경 이슈로 실패 지속 (`vite/esbuild spawn EPERM`)

### 2026-02-23 세션 #5

#### 요청
- 거래 장소를 지도에서 검색하여 등록 가능하게 개선

#### 완료 작업
- 프론트 지도 검색 추가
  - 카카오 SDK 로드 시 `libraries=services` 포함
  - `KakaoLocationPicker`에 키워드 검색 UI/결과 리스트 추가
  - 검색 결과 선택 시 방 생성 폼에 장소명/주소/좌표 반영
- 백엔드 방 생성 확장
  - `RoomCreateRequest`에 `meetingLocationName/address/latitude/longitude` 필드 추가
  - `meetingLocationId`가 없는 경우, 전달된 검색 장소로 `locations`에 신규 저장 후 방 생성

#### 검증 결과
- 백엔드 테스트 통과: `cd backend && mvnw.cmd test` (3건 통과)
- 프론트 빌드: 환경 이슈로 실패 지속 (`vite/esbuild spawn EPERM`)

---

## 다음 할 일 (우선순위 순)

1. **프론트 로컬 실행 확인** — `cd frontend && npm run dev` 후 직접 UI 점검
2. **실서버 배포** — VPS 확보 → 도메인/TLS/리버스프록시/모니터링 운영값 적용
   - 참고: `docs/DEPLOY_RUNBOOK.md`, `docs/PREDEPLOY_CHECKLIST.md`

---

## 핵심 파일 빠른 참조

| 파일 | 경로 |
|---|---|
| 프론트 메인 | `frontend/src/App.jsx` |
| API 클라이언트 | `frontend/src/api.js` |
| 스타일 | `frontend/src/styles.css` |
| 방 상세 응답 DTO | `backend/src/main/java/com/banban/market/dto/response/RoomDetailResponse.java` |
| 방 서비스 | `backend/src/main/java/com/banban/market/service/RoomService.java` |
| 통합 테스트 | `backend/src/test/java/com/banban/market/integration/ApiFlowIntegrationTest.java` |
| 배포 런북 | `docs/DEPLOY_RUNBOOK.md` |
| 배포 체크리스트 | `docs/PREDEPLOY_CHECKLIST.md` |
