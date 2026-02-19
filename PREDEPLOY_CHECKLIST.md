# PREDEPLOY_CHECKLIST

## 1. Local Quality Gate
- [ ] `cd backend && ./mvnw test` 통과
- [ ] 주요 API 수동 확인(Auth/Room/Review/User/Location)
- [ ] `docker compose up --build`로 prod profile 기동 확인
- [ ] `http://localhost:8080/actuator/health` 상태 `UP` 확인

## 2. Environment Variables
- [ ] `JWT_SECRET` 32자 이상 랜덤값
- [ ] `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`
- [ ] `CORS_ORIGINS` 운영 프론트 도메인 반영
- [ ] `SPRING_PROFILES_ACTIVE=prod`

## 3. Database
- [ ] Flyway 마이그레이션 자동 적용 확인 (`V1__init_schema.sql`)
- [ ] 운영 DB 접근 권한 최소화(전용 계정)
- [ ] 백업/복구 정책 수립

## 4. Security
- [ ] 기본 개발용 JWT secret 미사용
- [ ] 운영 CORS 도메인 외 차단
- [ ] 불필요한 포트/엔드포인트 노출 차단

## 5. Operations
- [ ] 애플리케이션 로그 수집 경로 정의
- [ ] 장애 대응 연락/롤백 절차 정리
- [ ] 초기 관리자/운영 계정 정책 확정
