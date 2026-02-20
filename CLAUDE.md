# 반반마켓 (BanBan Market) - Claude Code 전용 컨텍스트

> 이 파일은 Claude Code가 매 세션마다 자동으로 읽습니다.
> Codex와 번갈아 작업하므로, 작업 후 반드시 이 파일과 codex_history.md를 모두 업데이트하세요.

## 프로젝트 개요
동네 기반 대용량 공동구매 매칭 플랫폼. 카톡/당근 등 임시 수단으로 이루어지는 공동구매를 시스템화.
MVP는 P2P(플랫폼 비결제) 방식으로 매칭·관리만 제공.

## 기술 스택
- **Backend**: Java 17 + Spring Boot 3.5.10 (Maven) / H2(dev) + PostgreSQL(prod) / JWT Auth
- **Frontend**: React 18 + Vite (단일 SPA, TypeScript 미사용)
- **배포**: Docker Compose 준비 완료

## 프로젝트 구조
```
banbanmarket/
├── backend/          # Spring Boot
├── frontend/         # React + Vite
├── docs/API_KEYS.md  # API 키 발급 가이드
├── REQUIRED_KEYS.md  # 운영 환경 변수 목록
├── codex_history.md  # Codex 작업 이력 (Codex와 공유)
├── docker-compose.yml
└── CLAUDE.md         # 이 파일 (Claude Code 자동 로딩)
```

## 핵심 파일 경로
| 역할 | 경로 |
|---|---|
| 백엔드 진입점 | `backend/src/main/java/com/banban/market/BanbanMarketApplication.java` |
| 보안 설정 | `backend/.../config/SecurityConfig.java` |
| 장소 시드 데이터 | `backend/.../config/LocationDataInitializer.java` |
| 통합 테스트 | `backend/.../integration/ApiFlowIntegrationTest.java` |
| 프론트 메인 | `frontend/src/App.jsx` (단일 파일 SPA) |
| API 클라이언트 | `frontend/src/api.js` |

## 로컬 실행
```bash
# 백엔드 (H2 인메모리 DB, 별도 설정 불필요)
cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
# → http://localhost:8080  /  H2 콘솔: http://localhost:8080/h2-console

# 프론트
cd frontend && npm install && npm run dev
# → http://localhost:5173 (Vite proxy → /api → 8080)

# 테스트
cd backend && ./mvnw test
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
- **백엔드**: MVP 완성. 테스트(컨텍스트 로드 + 통합 플로우) 통과.
- **이벤트 정책**: 2026-02-20 ~ 2026-05-20 가입자 score=80 부여(환경변수로 조정 가능).
- **프론트엔드**: React 단일 SPA + API 연동 완료. `npm run build` 성공.
- **지도(Kakao Maps)**: SDK 단일 로딩/hidden mount 회피/relayout 보정 적용 완료.
- **배포 준비**: `docker-compose.yml`, `backend/Dockerfile`, `PREDEPLOY_CHECKLIST.md`, `docs/DEPLOY_RUNBOOK.md`, `scripts/deploy.sh` 준비 완료.
- **CI**: `.github/workflows/ci.yml` 추가 완료(backend test + frontend build).
- **남은 작업**: VPS 확보 후 실서버 반영(도메인/TLS/리버스프록시/모니터링 운영값 적용).

## 트리거 키워드
사용자가 **"계속해"** 라고 말하면:
1. `codex_history.md`의 최신 히스토리를 읽는다
2. "다음 이어서 할 일" 항목부터 즉시 작업 시작
3. 별도 확인 없이 바로 개발 진행

## 필수 작업 규칙
1. **작업 완료 시 이 파일(CLAUDE.md)의 "현재 개발 상태" 업데이트**
2. **작업 완료 시 codex_history.md에 히스토리 누적 기록** (형식: `## YYYY-MM-DD HH:MM:SS (KST) - History #N`)
3. codex_history.md 기록 내용: 요청/지시, 완료 작업, 검증 결과, 현재 상태, 다음 할 일
4. Codex와 번갈아 작업하므로 인수인계 누락 금지
