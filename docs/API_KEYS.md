# 반반마켓 - 필요한 API 키 및 환경 변수 가이드

## 1. 카카오 지도 API (Kakao Maps JavaScript SDK)

**용도:** 거래 장소를 지도에 표시 (선택사항 - MVP에서는 텍스트 주소로 대체 가능)

### 발급 방법
1. [Kakao Developers](https://developers.kakao.com) 접속 후 로그인
2. **내 애플리케이션** → **애플리케이션 추가하기**
3. 앱 이름: `반반마켓` 설정 후 저장
4. **앱 설정** → **플랫폼** → **Web** 탭
5. 사이트 도메인 추가:
   - 개발: `http://localhost:5173`
   - 운영: 실제 도메인 (`https://banbanmarket.com` 등)
6. **앱 키** 탭에서 **JavaScript 키** 복사

### 환경 변수 설정
```bash
# frontend/.env
VITE_KAKAO_MAP_KEY=발급받은_JavaScript_키
```

### index.html에 SDK 추가
```html
<script type="text/javascript"
  src="//dapi.kakao.com/v2/maps/sdk.js?appkey=발급받은_JavaScript_키&autoload=false">
</script>
```

> **참고:** JavaScript 키는 청구 없이 월 30만 건까지 무료 사용 가능합니다.

---

## 2. Google AdSense (광고 수익화)

**용도:** 플랫폼 광고 수익 (현재 코드에는 자리표시자로 준비됨)

### 발급 방법
1. [Google AdSense](https://www.google.com/adsense) 접속
2. 사이트 URL 등록 및 심사 신청
3. 승인 후 **광고 단위 생성** → 게시자 ID (`ca-pub-XXXXXXXXXXXXXXXXX`) 및 슬롯 ID 발급

### 환경 변수 설정
```bash
# frontend/.env
VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXXX
```

> **참고:** 실서비스 배포 후 최소 트래픽(월 수천 PV)이 확보되면 신청하세요.

---

## 3. JWT Secret Key

**용도:** 사용자 인증 토큰 서명 (필수)

### 생성 방법
```bash
# 터미널에서 실행 (32자 이상 랜덤 문자열 생성)
openssl rand -base64 48
```

### 환경 변수 설정
```bash
# 루트 .env 또는 배포 서버 환경 변수
JWT_SECRET=생성된_랜덤_문자열_32자_이상
```

> **주의:** 이 값이 유출되면 모든 토큰이 위조될 수 있습니다. 절대 깃허브에 커밋하지 마세요.

---

## 4. PostgreSQL 데이터베이스 (운영 환경)

**용도:** 운영 서버 데이터베이스 (개발 시에는 H2 자동 사용, 운영 배포 시 필요)

### 로컬 PostgreSQL 세팅
```bash
# Homebrew로 설치
brew install postgresql@15
brew services start postgresql@15

# DB 및 유저 생성
psql postgres -c "CREATE DATABASE banbanmarket;"
psql postgres -c "CREATE USER banban WITH PASSWORD '강력한_비밀번호';"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE banbanmarket TO banban;"
```

### 환경 변수 설정
```bash
# 루트 .env
POSTGRES_DB=banbanmarket
POSTGRES_USER=banban
POSTGRES_PASSWORD=강력한_비밀번호

DATABASE_URL=jdbc:postgresql://localhost:5432/banbanmarket
DATABASE_USERNAME=banban
DATABASE_PASSWORD=강력한_비밀번호
```

---

## 5. CORS 허용 오리진

**용도:** 백엔드가 허용할 프론트엔드 도메인 (기본값: 개발 환경 자동 설정)

```bash
# 루트 .env
CORS_ORIGINS=http://localhost:5173
# 운영 배포 시 예시:
# CORS_ORIGINS=https://banbanmarket.com,https://www.banbanmarket.com
```

---

## 로컬 개발 실행 순서

### 1단계: 백엔드 실행 (H2 인메모리 DB, 별도 설정 불필요)
```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# 백엔드: http://localhost:8080
# H2 콘솔: http://localhost:8080/h2-console
#   JDBC URL: jdbc:h2:mem:banbandb
#   Username: sa | Password: (비워두기)
```

### 2단계: 프론트엔드 실행
```bash
cd frontend
npm install
npm run dev

# 프론트엔드: http://localhost:5173
```

### 3단계 (선택): Docker Compose로 한번에 실행
```bash
# 루트 .env.example을 복사 후 값 입력
cp .env.example .env
vi .env

# Docker Compose 실행
docker-compose up -d
```

---

## 환경 변수 우선순위 요약

| 변수명 | 로컬 개발 | 운영 배포 | 필수 여부 |
|---|---|---|---|
| `JWT_SECRET` | `application.yml` 기본값 사용 | **반드시 별도 설정** | 운영 필수 |
| `DATABASE_URL` | H2 자동 사용 | **반드시 설정** | 운영 필수 |
| `DATABASE_USERNAME` | H2 자동 사용 | **반드시 설정** | 운영 필수 |
| `DATABASE_PASSWORD` | H2 자동 사용 | **반드시 설정** | 운영 필수 |
| `CORS_ORIGINS` | `application.yml` 기본값 사용 | 실제 도메인으로 변경 권장 | 운영 권장 |
| `VITE_API_BASE_URL` | Vite proxy가 처리 (비워도 됨) | 운영 백엔드 URL | 운영 필수 |
| `VITE_KAKAO_MAP_KEY` | 선택 | 지도 기능 시 필요 | 선택 |
| `VITE_ADSENSE_CLIENT` | 선택 | 광고 수익화 시 필요 | 선택 |
