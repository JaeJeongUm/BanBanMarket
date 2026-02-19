# Frontend (React)

## 개요
- 이 폴더는 `backend`와 분리된 React 프론트엔드입니다.
- 개발 서버 기본 포트: `5173`
- 백엔드 API(`8080`)는 Vite proxy(`/api`, `/actuator`)로 연결됩니다.

## 실행
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## 환경변수
- `VITE_API_BASE_URL`
  - 비워두면 proxy 사용
  - 예: `http://localhost:8080`

## 구현된 화면
- 로그인/회원가입
- 방 목록/방 상세
- 방 생성
- 방 참여
- 방장 수령체크/거래완료 처리
- 후기 작성
- 내 정보(내가 만든 방/참여한 방/받은 후기)
