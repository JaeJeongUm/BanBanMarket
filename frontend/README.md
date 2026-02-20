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
- `VITE_KAKAO_MAP_KEY`
  - 카카오 JavaScript 키
  - 키만 넣는 것이 아니라 Kakao Developers의 Web 플랫폼에 `http://localhost:5173` 등록 필요

## 구현된 화면
- 로그인/회원가입
- 방 목록/방 상세
- 방 생성
- 방 참여
- 방장 수령체크/거래완료 처리
- 후기 작성
- 내 정보(내가 만든 방/참여한 방/받은 후기)

## 지도 트러블슈팅
- 첫 로드 때 지도 SDK 로딩으로 1~2초 지연될 수 있습니다.
- 지도가 비정상/흰 화면이면 브라우저 콘솔에서 아래 확인:
  - `Kakao Maps API error: appkey is invalid`
  - `Kakao Maps API error: domain mismatched`
- 해결:
  1. `frontend/.env`의 `VITE_KAKAO_MAP_KEY` 값 확인
  2. Kakao Developers > 앱 > 플랫폼(Web)에 `http://localhost:5173` 등록
  3. 프론트 dev 서버 재시작 (`npm run dev`)
