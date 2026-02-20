# Banban Market 아키텍처 분석

## 1) 시스템 성격 요약
- 현재 구조는 **MSA가 아닌 모놀리식 아키텍처**입니다.
- 프론트엔드(`frontend`)와 백엔드(`backend`)는 리포지토리에서 분리되어 있지만, 백엔드는 단일 Spring Boot 애플리케이션으로 동작합니다.
- 핵심 도메인(Auth, User, Room, Review, Location)이 하나의 서비스/코드베이스/배포 단위로 운영됩니다.

## 2) 상위 구조
- **Frontend**: React 18 + Vite SPA
- **Backend**: Spring Boot 3.5.10 + Spring Security + JWT + JPA
- **Database**:
  - 개발: H2 메모리 DB (`dev`)
  - 운영: PostgreSQL + Flyway (`prod`)
- **배포**: Docker Compose 기반(`postgres` + `backend`)

## 3) 백엔드 레이어 구조
- `controller`: HTTP 엔드포인트 수신, DTO 검증 결과 전달
- `service`: 비즈니스 규칙 처리(점수/권한/상태 전이)
- `repository`: JPA 기반 데이터 접근
- `domain`: 엔티티 및 도메인 상태/행위
- `security`: JWT 발급/검증, 인증 컨텍스트 처리
- `exception`: 에러 코드/핸들러 중앙 관리
- `scheduler`: 마감시간 기반 방 자동 종료

요약 흐름:
`Client -> Controller -> Service -> Repository -> DB`

## 4) 인증/보안 구조
- 인증 방식: JWT Bearer 토큰
- 공개 API:
  - `POST /api/auth/**`
  - `GET /api/rooms/**`, `GET /api/locations/**`, `GET /api/reviews/**`, `GET /api/users/**`
  - `GET /actuator/health/**`
- 보호 API: 생성/참여/완료/후기 작성 등은 인증 필요
- CORS 허용 도메인은 환경변수(`CORS_ORIGINS`)로 제어

## 5) 도메인 모델 핵심
- `User`: 점수(`score`), 미작성후기수(`pendingReviewCount`), 활성화 여부
- `Room`: 카테고리, 목표수량/현재수량, 상태(`OPEN/CLOSED/COMPLETED/CANCELLED`), 마감/모임 시간
- `RoomParticipant`: 방-사용자 참여 관계, 수령 상태(`JOINED/RECEIVED`)
- `Review`: 거래 후기(평점, 코멘트, 타입)
- `Location`: 지정 거래장소

## 6) 핵심 비즈니스 정책
- 방 생성 권한: 기본적으로 `score >= 80`
- 이벤트 기간 가입자 특례:
  - `EVENT_HOST_OPEN_START_DATE` ~ `EVENT_HOST_OPEN_END_DATE` 사이 가입 시 시작 점수 80
- 미작성 후기(`pendingReviewCount > 0`)가 있으면 방 생성/참여 제한
- 거래 장소는 `Location` 테이블의 지정 장소만 허용
- 방 상태 전이:
  - 목표수량 달성 시 `OPEN -> CLOSED`
  - 마감시간 초과 OPEN 방은 스케줄러(1분)로 `CLOSED`
  - 참여자 전원 `RECEIVED`일 때만 `CLOSED -> COMPLETED`
- 점수 정책:
  - 거래완료 +5
  - 좋은후기(4~5점) +2
  - 나쁜후기(1~2점) -5
  - 노쇼 -20

## 7) 프론트엔드 구조
- 단일 SPA에서 주요 화면/모달 상태를 관리
- API 통신은 `src/api.js`로 집약
- 개발 서버 포트는 `5173` 고정(`strictPort: true`)
- Vite proxy로 `/api`, `/actuator`를 `http://localhost:8080`으로 전달
- Kakao Maps SDK 로딩 안정화 로직 반영(지연 재레이아웃 포함)

## 8) 데이터/운영 구조
- `dev`: H2, `ddl-auto=create-drop`, Flyway 비활성
- `prod`: PostgreSQL, `ddl-auto=validate`, Flyway 활성
- 운영 컨테이너:
  - `postgres:16`
  - `backend` (Spring Boot jar)
- 헬스체크: `/actuator/health`

## 9) 테스트/품질 게이트
- 통합 테스트: 회원가입 -> 방생성 -> 참여 -> 수령확인 -> 거래완료 -> 후기 작성 플로우 검증
- 이벤트 기간 가입 점수 80 검증 테스트 존재
- CI:
  - Backend: Maven test
  - Frontend: npm build

## 10) 현재 아키텍처 평가
### 장점
- 단일 배포 단위로 개발/운영 단순
- 정책 변경 시 반영 지점이 명확(Service 중심)
- MVP 단계에서 속도/일관성 확보에 유리

### 한계
- 단일 백엔드에 도메인 결합도가 높아 기능 확장 시 영향 범위 증가
- 프론트는 `App.jsx` 중심으로 상태/기능 밀집(복잡도 상승 가능)
- 서비스 독립 배포/독립 확장(스케일 아웃) 구조는 아직 아님

## 11) 향후 확장 방향(권장)
1. 모듈화 1단계(모놀리식 유지)
- 백엔드를 도메인 패키지 기준으로 더 강하게 분리(Auth/Room/Review/User)
- 프론트를 페이지/컴포넌트/상태 훅 단위로 분해

2. MSA 전환 2단계(필요 시)
- 우선 분리 후보: `Auth`, `Room`, `Review`
- API Gateway, 토큰 검증 표준화, 서비스 간 이벤트 설계 도입
- DB 분리 전에는 도메인 경계와 트랜잭션 전략 먼저 확정

현재 결론:
- 이 프로젝트는 **기능 완성형 모놀리식 MVP**이며, 운영 전 단계까지 실용적으로 잘 정리된 상태입니다.
