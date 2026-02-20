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

## 트러블슈팅
### 1) `spring-boot:run` 실패 (`Process terminated with exit code: 1`)
- 원인 대부분은 포트 바인딩(8080) 실패입니다.
- 아래처럼 원인 확인:
```bash
lsof -i :8080
```
- 8080을 이미 쓰고 있으면 다른 포트로 실행:
```bash
./mvnw spring-boot:run -Dspring-boot.run.arguments=--server.port=8081
```
- 로그에 `java.net.SocketException: Operation not permitted`가 보이면
  현재 실행 환경에서 소켓 바인딩이 제한된 경우입니다(권한/보안정책/샌드박스).

### 2) 프론트는 뜨는데 API 호출 실패
- 백엔드 실행 포트가 8080이 아닌 경우 `frontend/.env`에 설정:
```bash
VITE_API_BASE_URL=http://localhost:8081
```
