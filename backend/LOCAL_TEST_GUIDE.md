# LOCAL_TEST_GUIDE

## 빠른 로컬 실행 (개발 모드: H2)
1. `cd backend`
2. `./mvnw spring-boot:run`
3. API 확인
- Health: `GET http://localhost:8080/actuator/health`
- H2 Console: `http://localhost:8080/h2-console`

## 로컬 운영 유사 실행 (prod + PostgreSQL)
1. 루트에서 `.env.example` 복사
- `cp .env.example .env`
2. `.env`에서 `JWT_SECRET` 변경
3. 실행
- `docker compose up --build`
4. 상태 확인
- `GET http://localhost:8080/actuator/health`

## 종료
- `docker compose down`
- 데이터까지 삭제: `docker compose down -v`
