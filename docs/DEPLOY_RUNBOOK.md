# BanBan Market Deploy Runbook

## 목적
- 새 서버에서 `BanBanMarket`를 중단 없이 기동하고, 장애 시 빠르게 롤백한다.

## 사전 준비
- 서버: Ubuntu 22.04+ (권장)
- 설치: Docker, Docker Compose plugin, Git
- GitHub 접근 권한(SSH 키 또는 PAT)
- 도메인 및 TLS(리버스 프록시 사용 시)

## 1. 서버 1회 초기화
```bash
sudo apt update
sudo apt install -y git ca-certificates curl

# Docker 공식 가이드로 엔진/compose 설치
# https://docs.docker.com/engine/install/ubuntu/
```

## 2. 코드 배포 디렉터리 준비
```bash
mkdir -p ~/apps
cd ~/apps
git clone https://github.com/JaeJeongUm/BanBanMarket.git
cd BanBanMarket
```

## 3. 환경 변수 준비
```bash
cp .env.example .env
```
- `.env`에 아래 필수값 입력
  - `JWT_SECRET`
  - `POSTGRES_DB`
  - `POSTGRES_USER`
  - `POSTGRES_PASSWORD`
  - `CORS_ORIGINS` (운영 프론트 도메인)

## 4. 최초 기동
```bash
docker compose up -d --build
```

## 5. 헬스 체크
```bash
curl -f http://localhost:8080/actuator/health
```
- 응답에 `"status":"UP"`가 나와야 정상.

## 6. 배포(업데이트) 절차
```bash
cd ~/apps/BanBanMarket
git pull origin main
docker compose up -d --build
```

## 7. 롤백 절차
1. 이전 커밋으로 체크아웃
```bash
git log --oneline -n 10
git checkout <previous_commit_sha>
```
2. 재기동
```bash
docker compose up -d --build
```
3. 정상 확인 후 필요 시 태그/브랜치 전략 도입

## 8. 점검 체크리스트
- API 헬스 정상
- 프론트 페이지 로딩 정상
- 회원가입/로그인/방 생성/참여/완료/후기 핵심 플로우 점검
- DB 볼륨 유지 확인(`docker volume ls`)

## 9. 운영 권장 사항
- Docker 이미지/컨테이너 정리 cron 운영
- 로그 로테이션 설정
- 주기적 DB 백업(최소 일 1회)
- 방화벽에서 22/80/443 외 최소 개방
