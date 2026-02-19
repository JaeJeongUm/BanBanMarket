# codex_history.md

## 2026-02-19 17:10 (KST) - History #1

### 요청/지시
- 사용자가 `command.md`를 기준으로 프로젝트를 이어서 개발하라고 요청.
- 이후 사용자가 "단계별로 이어개발 가능하게 `codex_history.md`를 남겨라, 우선 첫 번째를 남겨라"라고 요청.

### 이번 턴까지 완료한 개발 내용 요약
1. 백엔드 API 계층 추가
- AuthController, RoomController, ReviewController, LocationController, UserController 생성.

2. 핵심 서비스 구현
- RoomService 생성: 방 목록/상세, 생성, 참여, 수령 체크, 완료 처리, 만료 방 자동 마감.
- ReviewService 생성: 후기 생성, 관계 검증(방장/참여자 방향), 점수 반영.
- SecurityUtils 생성: 현재 로그인 사용자 ID 추출 유틸.

3. 정책 반영
- 방 생성 점수 80 이상 제한.
- 미작성 후기(pendingReviewCount)가 있으면 주요 동작 제한.
- 지정 장소(Location)만 거래 장소로 허용.
- 방장 참여 금지, 중복 참여 금지, 수량 초과 금지.
- CLOSED + 전원 RECEIVED 시에만 거래 완료.
- COMPLETED 상태에서만 후기 작성 가능.

4. 운영 편의/기본 데이터
- RoomScheduler 추가(1분 주기 만료 OPEN 방 CLOSED 처리).
- dev 프로필용 LocationDataInitializer 추가(지정 장소 시드 데이터).
- BanbanMarketApplication에 @EnableScheduling 추가.

5. 보안/예외 보완
- SecurityConfig permitAll 경로 보완(`/api/locations/**`, `/api/reviews/**`).
- ErrorCode에 ROOM_NOT_CLOSED 추가.

6. 문서 추가
- REQUIRED_KEYS.md 생성(필수 환경변수 정리).
- backend/API-CHECKLIST.md 생성(MVP API 체크리스트).

7. 테스트/빌드 검증
- Mockito inline attach 이슈 해결을 위해
  `backend/src/test/resources/mockito-extensions/org.mockito.plugins.MockMaker`
  파일 생성(`mock-maker-subclass`).
- `cd backend && ./mvnw test -q` 성공 확인.

### 현재 상태
- 백엔드는 컨트롤러-서비스-도메인 연결이 된 MVP API 상태.
- 프론트(React)는 아직 미구현이며, 루트의 `banban-market.html`은 시안 파일.

### 다음 턴 이어서 할 일(권장 순서)
1. React 프론트 앱 초기 구성 및 API 클라이언트/인증 상태 관리 연결.
2. 방 목록/상세/참여/거래완료/후기 작성 화면을 API와 연결.
3. MockMvc 기반 통합 테스트 작성(핵심 플로우).

### 작업 규칙(사용자 요청 반영)
- 앞으로 모든 단계 작업 후 `codex_history.md`에 동일한 형식으로 히스토리를 누적 기록한다.

## 2026-02-19 17:09:05 (KST) - History #2

### 요청/지시
- 사용자 요청: 작업 이력에 "언제 작업했는지 알 수 있도록 날짜와 시간도 같이" 남길 것.

### 반영 내용
- 앞으로 모든 히스토리 항목 제목에 `YYYY-MM-DD HH:MM:SS (KST)` 형식으로 기록.
- 각 단계 완료 시점의 실제 시간을 기준으로 누적 기록.

### 작업 규칙 업데이트
- 필수: 모든 히스토리 항목에 날짜/시간/타임존을 함께 남긴다.

## 2026-02-19 17:13:45 (KST) - History #3

### 요청/지시
- 사용자 질문: 개발이 모두 완료됐는지, 아직 못한 부분과 더 해야 할 부분 확인 요청.

### 수행 내용
- 현재 프로젝트 구조/구현 상태 재점검.
- 컨트롤러/스케줄러 존재 확인.
- `./mvnw test -q` 재실행하여 빌드/기본 테스트 통과 확인.

### 중간 결론
- 백엔드 MVP API 골격은 구현 및 실행 가능.
- 프론트(React) 미구현, 통합 테스트/운영 배포/문서/API 스펙 고도화 등은 추가 작업 필요.

## 2026-02-19 17:23:41 (KST) - History #4

### 요청/지시
- 로컬 테스트가 가능하고, 운영 서버 배포 직전 단계까지 개발 진행 요청.

### 이번 단계에서 완료한 작업
1. 운영 DB 마이그레이션 체계 추가
- `backend/pom.xml`: Flyway 의존성(`flyway-core`, `flyway-database-postgresql`) 추가.
- `backend/src/main/resources/db/migration/V1__init_schema.sql` 생성.
- `backend/src/main/resources/application-prod.yml`: PostgreSQL + Flyway 활성화.
- `backend/src/main/resources/application-dev.yml`: Flyway 비활성화(dev 빠른 개발 유지).

2. 운영 헬스체크/보안 경로 준비
- `backend/src/main/resources/application.yml`: actuator health/info 노출 설정 추가.
- `backend/src/main/java/com/banban/market/config/SecurityConfig.java`: `/actuator/health/**` GET 허용.

3. 로컬/운영 유사 실행 자산 추가
- `backend/Dockerfile` (멀티스테이지 빌드)
- `backend/.dockerignore`
- `docker-compose.yml` (postgres + backend)
- `.env.example`
- `backend/LOCAL_TEST_GUIDE.md`
- `PREDEPLOY_CHECKLIST.md`

4. 로컬 검증 강화를 위한 통합 테스트 추가
- `backend/src/test/java/com/banban/market/integration/ApiFlowIntegrationTest.java`
- 시나리오: 가입 -> 방생성 -> 참여 -> 수령체크 -> 완료 -> 후기 작성

### 실행 검증 결과
- `cd backend && ./mvnw test -q` 통과.
- `cd backend && ./mvnw -q -DskipTests package` 통과(JAR 패키징 성공).

### 현재 상태
- 백엔드는 로컬 테스트/패키징 가능한 상태.
- 배포 직전 단계 문서/설정/컨테이너 실행 정의 완료.
- 실제 서버 배포(인프라 반영/도메인/TLS/CI)는 아직 미수행.

## 2026-02-19 17:32:11 (KST) - History #5

### 요청/지시
- backend와 frontend를 분리해서 개발할 것.
- React 화면이 미구현이면 구현할 것.

### 이번 단계에서 완료한 작업
1. 프론트엔드 분리 구조 생성
- 신규 디렉터리 `frontend/` 생성.
- `frontend/package.json`, `frontend/vite.config.js`, `frontend/index.html` 구성.

2. React 화면 개발
- `frontend/src/App.jsx`: 인증/방목록/방상세/방생성/참여/수령체크/거래완료/후기/내정보 화면 구현.
- `frontend/src/api.js`: 백엔드 API 호출 래퍼 구현.
- `frontend/src/styles.css`: 반응형 기본 UI 스타일 구현.
- `frontend/src/main.jsx` 엔트리 구성.

3. 프론트 실행 문서 추가
- `frontend/README.md` 작성.
- `frontend/.env.example`, `frontend/.gitignore` 추가.

### 검증 상태
- 코드/구조 작성 완료.
- `npm install` 시도했으나 현재 실행 환경 네트워크 제한으로 npm registry 접근 실패(`ENOTFOUND`)하여 의존성 설치/빌드는 이 환경에서 검증 불가.

### 현재 상태
- backend/frontend 분리 완료.
- React 화면 코드 구현 완료.
- 실제 실행 검증은 네트워크 가능한 로컬 환경에서 `cd frontend && npm install && npm run dev`로 진행 필요.

## 2026-02-19 17:36:50 (KST) - History #6

### 요청/지시
- `banban-market.html`과 똑같이 만들 것.

### 이번 단계에서 완료한 작업
1. 원본 시안 파일을 프론트 정적 자산으로 복사
- `frontend/public/banban-market.html`

2. React 렌더를 원본 시안 1:1 표시 방식으로 변경
- `frontend/src/App.jsx`: `/banban-market.html`을 iframe으로 전체 화면 렌더.
- `frontend/src/styles.css`: iframe full viewport 스타일 적용.

### 결과
- 프론트에서 기존 `banban-market.html`과 동일한 화면/동작을 그대로 표시하도록 반영 완료.

## 2026-02-19 17:43:20 (KST) - History #7

### 요청/지시
- `banban-market.html` 디자인을 따라 React로 구현.
- backend와 통신 가능해야 하며 다른 기능도 연결.

### 이번 단계에서 완료한 작업
1. 기존 iframe 렌더 제거 후 React 실제 화면 재구현
- `frontend/src/App.jsx` 전면 교체.
- 원본 HTML 클래스 구조(홈/탐색/내거래/마이/모달/FAB/하단 네비)를 React 상태 기반으로 구현.

2. backend API 연동 강화
- `frontend/src/api.js` 재작성.
- 인증(로그인/회원가입), 방목록/상세, 방생성, 참여, 수령체크, 거래완료, 후기작성, 내정보/내거래 조회 API 연결.

3. 원본 디자인 반영
- `frontend/src/styles.css`를 `banban-market.html`의 원본 style 블록으로 동기화.
- `frontend/index.html` 폰트를 원본(`Noto Sans KR`, `Gmarket Sans`)으로 변경.

4. 추가 연결
- 내거래 탭(참여/방장/완료)에서 상세/참여자/수령체크/후기 동작 연결.
- 채팅 모달 UI 연결(채팅은 로컬 상태 기반, 서버 실시간 연동은 미구현).

### 참고
- 실행 환경 네트워크 제한으로 npm 의존성 설치/빌드 검증은 이 환경에서 불가(`ENOTFOUND` 발생).

## 2026-02-19 17:46:10 (KST) - History #8

### 요청/지시
- 실행 방법 안내 요청.

### 수행 내용
- 로컬 개발 실행(backend + frontend) 방법 정리.
- Docker Compose 기반 실행 방법 정리.
- 기본 점검 URL 및 종료 방법 안내.

## 2026-02-19 17:48:30 (KST) - History #9

### 요청/지시
- 현재까지 작업 내용을 GitHub에 push 요청.

### 수행 내용
- 루트/`backend`/`frontend` 경로에서 Git 저장소 여부 확인.
- 결과: `.git`이 없어 어떤 경로도 Git repository가 아님.

### 상태
- push 진행 불가(원격/브랜치 설정 이전 단계).
- 다음 필요 작업: git init, remote 등록, commit, push.

## 2026-02-19 17:51:30 (KST) - History #10

### 요청/지시
- 현재까지 작업물을 GitHub(`https://github.com/JaeJeongUm/BanBanMarket.git`)에 push 요청.

### 수행 내용
1. Git 저장소 초기화 및 원격 연결
- `git init`
- `git branch -M main`
- `git remote add origin https://github.com/JaeJeongUm/BanBanMarket.git`

2. 루트 `.gitignore` 추가 후 커밋
- 커밋: `feat: scaffold BanBanMarket backend and React frontend MVP`

3. push 시도 결과
- 1차 실패: 네트워크 제한(`Could not resolve host: github.com`)
- 2차(권한상승) 실패: GitHub 인증 정보 없음(`could not read Username for 'https://github.com': Device not configured`)

### 현재 상태
- 로컬 커밋 완료.
- 원격 push는 GitHub 인증 설정 후 재시도 필요.

## 2026-02-19 17:53:20 (KST) - History #11

### 요청/지시
- GitHub push 시 로그인(인증) 필요 여부 질문.

### 답변 요약
- 맞음. GitHub 인증(HTTPS PAT 또는 SSH 키)이 있어야 push 가능.

## 2026-02-19 17:59:10 (KST) - History #12

### 요청/지시
- GitHub push 재요청.

### 수행 내용
1. SSH 원격으로 push 시도
- 결과: `Permission denied (publickey)`

2. 원격 확인
- `origin`이 `git@github.com:JaeJeongUm/BanBanMarket.git`로 설정되어 있었음.

3. HTTPS 원격으로 변경 후 재시도
- `git remote set-url origin https://github.com/JaeJeongUm/BanBanMarket.git`
- 결과: `could not read Username for 'https://github.com': Device not configured`

### 현재 상태
- 로컬 커밋은 완료.
- GitHub 인증(HTTPS PAT 또는 SSH 키) 미설정으로 push 불가.
