# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> 이 파일은 Claude Code가 매 세션마다 자동으로 읽습니다.
> 작업 완료 시 이 파일(CLAUDE.md)의 "현재 개발 상태"를 업데이트하세요.

## 프로젝트 개요
동네 기반 대용량 공동구매 매칭 플랫폼. 카톡/당근 등 임시 수단으로 이루어지는 공동구매를 시스템화.
MVP는 P2P(플랫폼 비결제) 방식으로 매칭·관리만 제공.

## 기술 스택
- **Backend**: Java 17 + Spring Boot 3.5.10 (Maven) / H2(dev) + PostgreSQL(prod) / JWT Auth
- **Frontend**: React 18 + Vite (단일 SPA, TypeScript 미사용)
- **배포**: Docker Compose 준비 완료

## 로컬 실행
```bash
# 백엔드 (H2 인메모리 DB, 별도 설정 불필요)
cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
# → http://localhost:8080  /  H2 콘솔: http://localhost:8080/h2-console

# 프론트 (Vite proxy: /api, /actuator → http://localhost:8080)
cd frontend && npm install && npm run dev
# → http://localhost:5173

# 전체 테스트
cd backend && ./mvnw test

# 단일 테스트 클래스 실행
cd backend && ./mvnw test -Dtest=ApiFlowIntegrationTest
```

## 프로젝트 구조 & 핵심 파일 경로
```
BanBanMarket/
├── backend/src/main/java/com/banban/market/   # 루트 패키지
│   ├── config/
│   │   ├── SecurityConfig.java                # Spring Security + JWT + CORS
│   │   └── LocationDataInitializer.java       # 거래 장소 5개 시드 데이터
│   ├── controller/                            # AuthController, RoomController, ReviewController, UserController, LocationController
│   ├── domain/                                # User, Room, RoomParticipant, Review, Location + enums
│   ├── dto/request/ & dto/response/           # 요청/응답 DTO
│   ├── exception/                             # BusinessException, ErrorCode, GlobalExceptionHandler
│   ├── repository/                            # JPA repositories (5개)
│   ├── scheduler/RoomScheduler.java           # 1분 주기 방 자동 마감
│   ├── security/                              # JwtTokenProvider, JwtAuthenticationFilter, SecurityUtils
│   └── service/                               # 7개 서비스 (AuthService, RoomService, ScoreService 등)
├── backend/src/main/resources/
│   ├── application.yml                        # 공통 설정 (기본 프로필: dev)
│   ├── application-dev.yml                    # H2 인메모리 DB, Hibernate create-drop, H2 console 활성화
│   ├── application-prod.yml                   # PostgreSQL, Flyway 마이그레이션, Hibernate validate
│   └── db/migration/V1__init_schema.sql       # Flyway 스키마 (prod용)
├── backend/src/test/java/com/banban/market/
│   ├── BanbanMarketApplicationTests.java      # 컨텍스트 로드 테스트
│   └── integration/ApiFlowIntegrationTest.java # E2E 통합 플로우 (register→login→room→join→complete→review)
├── frontend/src/
│   ├── App.jsx                                # 단일 파일 SPA (모든 라우트·뷰·상태 포함)
│   ├── api.js                                 # fetch 래퍼 (JWT 토큰 자동 첨부)
│   └── styles.css
├── docker-compose.yml                         # postgres:16 + backend 서비스
├── .env.example                               # 백엔드 환경변수 템플릿
├── .github/workflows/ci.yml                   # CI (backend test + frontend build)
├── docs/                                      # DEPLOY_RUNBOOK.md, PREDEPLOY_CHECKLIST.md, REQUIRED_KEYS.md
└── scripts/deploy.sh
```

## 핵심 비즈니스 정책 (코드에 반드시 반영)
- 신규 유저 score=50, **방 생성은 score>=80 필요** (`User.canCreateRoom()`)
- 단, 이벤트 기간(`EVENT_HOST_OPEN_START_DATE`~`EVENT_HOST_OPEN_END_DATE`)에는
  신규 가입자 score=80으로 시작해 즉시 방장 권한 부여
- **미작성 후기(pendingReviewCount>0)** 있으면 방 생성·참여 차단
- 거래 장소는 **지정 장소만** (LocationDataInitializer 5개 시드, 자유입력 불가)
- 방 마감: 목표수량 달성 즉시 CLOSED / 마감시간 경과 시 스케줄러(1분)가 CLOSED
- 거래 완료: 참여자 **전원 RECEIVED** 상태여야 COMPLETED 처리 가능
- 점수: 완료+5, 좋은후기(4-5점)+2, 나쁜후기(1-2점)-5, 노쇼-20

## API 엔드포인트 요약
```
POST /api/auth/register|login
GET  /api/locations
GET  /api/rooms?category=&locationId=&status=&page=&size=
GET  /api/rooms/{id}
POST /api/rooms                              (score>=80 필요)
POST /api/rooms/{id}/join
POST /api/rooms/{id}/participants/{uid}/receive
POST /api/rooms/{id}/complete                (전원 RECEIVED 필요)
POST /api/reviews
GET  /api/reviews/users/{userId}
GET  /api/users/{id}
GET  /api/users/{id}/rooms/hosted|participated
GET  /api/users/{id}/reviews
GET  /actuator/health
```

## 현재 개발 상태
- **백엔드**: MVP 완성. 테스트(컨텍스트 로드 + 통합 플로우) 통과. `RoomResponse.updatedAt` 필드 추가, `createRoom` deadline/meetingTime 서버 검증 추가(2026-02-24).
- **이벤트 정책**: 2026-02-20 ~ 2026-05-20 가입자 score=80 부여(환경변수로 조정 가능).
- **프론트엔드**: React 단일 SPA + API 연동 완료. `npm run build` 성공.
  - **UI/UX 대규모 개선 완료 (2026-02-23)**: 로그인 모달 탭 전환·에러 내부 표시·비밀번호 토글·Enter 제출, 방 카드 상태 배지·마감임박 표시, FAB 점수/후기 조건 토스트, 방 상세 joinFailReason 표시·참여자 "나 ✓", 방 생성 단위당 가격 미리보기, 마이페이지 점수 가이드·로그아웃 버튼, 내 거래 비로그인 모달 유도, 로딩 dot 애니메이션, API 상태 텍스트 제거, 모달 스크롤 최상단 복귀 등.
  - **탐색 탭 보강 (2026-02-23)**: `search`/`nearby-room` 카드에도 상태 배지 + 마감 1시간 이내 `🔥곧마감` 태그를 홈과 동일 규칙으로 적용.
  - **로그인 전 접근 제어 UI 추가 (2026-02-23)**: 비로그인 시 전체 화면에 "로그인이 필요합니다" 안내 오버레이를 표시하고 로그인 모달로 유도.
  - **방 생성 UX 개선 (2026-02-23)**: 거래장소를 지도+마커 클릭으로 선택하도록 변경하고, 시간 입력을 `월/일(요일)+시간` 조합으로 재구성(연도 노출 제거).
  - **지도 검색 등록 지원 (2026-02-23)**: 방 생성 시 카카오 지도 키워드 검색 결과를 선택해 장소를 등록하고, 기존 장소 ID 없이도 백엔드에서 신규 `Location`을 생성해 방 생성 가능.
  - **버그 수정 및 UX 안정화 (2026-02-24)**: `KakaoLocationPicker` 무한 재렌더링 버그 수정(onSelectCustom useRef 패턴 적용), `resetCreateForm` 함수 추가(방 생성 성공/취소/오버레이 클릭 시 폼 초기화), `createModalError` state 추가(모달 내부 에러 표시), `error` 상태 4초 자동 소멸, 방 생성 필수 입력 검증(상품명/거래장소), CSS `width:87%` 하드코딩 제거.
- **인증(개발계)**: `dev` 프로필에서 테스트용 관리자 계정 자동 시드(`id: admin`, `pw: admin`) 추가. 로그인 요청은 아이디 문자열(`admin`)도 허용하도록 `LoginRequest` 이메일 형식 제한 제거.
- **지도(Kakao Maps)**: SDK 단일 로딩/hidden mount 회피/relayout 보정 적용 완료. 현재 위치(geolocation) 초기 표시 + 실패 시 강남역 폴백 적용(2026-02-24). 탐색 탭 지도는 OPEN 방의 거래장소만 표시. 지도 칩 제거, 선택 장소 카드 UI 추가.
- **배포 준비**: `docker-compose.yml`, `backend/Dockerfile`, `docs/PREDEPLOY_CHECKLIST.md`, `docs/DEPLOY_RUNBOOK.md`, `scripts/deploy.sh` 준비 완료.
- **CI**: `.github/workflows/ci.yml` 추가 완료(backend test + frontend build).
- **남은 작업**: VPS 확보 후 실서버 반영(도메인/TLS/리버스프록시/모니터링 운영값 적용).

## 트리거 키워드
사용자가 **"계속해"** 라고 말하면:
1. `codex_history.md`의 최신 히스토리를 읽는다
2. "다음 이어서 할 일" 항목부터 즉시 작업 시작
3. 별도 확인 없이 바로 개발 진행

사용자가 **"병렬 개발: [기능명 또는 작업 설명]"** 이라고 말하면:
→ 아래 **병렬 에이전트 워크플로**를 즉시 실행

## 병렬 에이전트 워크플로

세 에이전트를 **동시에(Task tool 단일 메시지 내 병렬 호출)** 실행한다.

| 에이전트 | 타입 | 역할 | 범위 |
|---|---|---|---|
| 백엔드 에이전트 | `general-purpose` | Spring Boot 코드 수정·구현 | `backend/` |
| 프론트엔드 에이전트 | `general-purpose` | React/Vite 코드 수정·구현 | `frontend/` |
| 테스트 분석 에이전트 | `Bash` | 테스트 실행 후 결과 리포트 | `backend/` 테스트 |

### 각 에이전트 역할 상세

**백엔드 에이전트 프롬프트 구조:**
- 프로젝트: Java 17 + Spring Boot 3.5.10, 루트 패키지 `com.banban.market`
- 변경 대상 기능·파일 명시
- 비즈니스 정책(score, 후기, 장소 제한 등) 반드시 준수
- 수정 파일 목록 및 변경 요약 반환

**프론트엔드 에이전트 프롬프트 구조:**
- 프로젝트: React 18 + Vite SPA, 핵심 파일 `frontend/src/App.jsx`
- 변경 대상 UI/기능 명시
- API 클라이언트(`api.js`) 수정 필요 시 함께 처리
- 수정 파일 목록 및 변경 요약 반환

**테스트 분석 에이전트 프롬프트 구조:**
- `cd backend && ./mvnw test` 실행
- 성공/실패 여부, 실패 테스트명, 에러 메시지 요약 반환
- 실패 원인 분석 및 수정 방향 제안

### 완료 후 처리
1. 세 에이전트 결과를 취합·검토
2. 충돌(백엔드↔프론트 인터페이스 불일치 등) 확인 및 해결
3. CLAUDE.md "현재 개발 상태" 업데이트

## 필수 작업 규칙
1. **작업 완료 시 이 파일(CLAUDE.md)의 "현재 개발 상태" 업데이트**
2. **작업 완료 시 HANDOFF.md 업데이트** (작업 이력에 날짜·요청·완료 작업·검증 결과·다음 할 일 누적)
