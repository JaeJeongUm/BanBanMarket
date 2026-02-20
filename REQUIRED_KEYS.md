# REQUIRED_KEYS.md

아래 값들은 배포 전에 반드시 채워야 하는 환경변수입니다.

1. `JWT_SECRET`
- 용도: JWT 서명 키
- 조건: 최소 32자 이상 랜덤 문자열
- 예시: `openssl rand -base64 48`

2. `CORS_ORIGINS`
- 용도: 프론트엔드 허용 Origin
- 형식: 콤마(`,`)로 구분
- 예시: `https://banbanmarket.com,https://www.banbanmarket.com`

3. `DATABASE_URL`
- 용도: 운영 DB 접속 URL(PostgreSQL)
- 예시: `jdbc:postgresql://<host>:5432/<db_name>`

4. `DATABASE_USERNAME`
- 용도: 운영 DB 계정

5. `DATABASE_PASSWORD`
- 용도: 운영 DB 비밀번호

## 권장 추가값

6. `SPRING_PROFILES_ACTIVE`
- 권장값: `prod`

7. `SERVER_PORT`
- 기본값: `8080`
- 필요 시 인프라 환경에 맞게 변경

8. `EVENT_HOST_OPEN_START_DATE` (선택)
- 용도: 방장 권한 이벤트 시작일(회원가입 점수 80 적용 시작)
- 형식: `YYYY-MM-DD`
- 기본값: `2026-02-20`

9. `EVENT_HOST_OPEN_END_DATE` (선택)
- 용도: 방장 권한 이벤트 종료일(종료 후 기본 가입 점수 50)
- 형식: `YYYY-MM-DD`
- 기본값: `2026-05-20`
