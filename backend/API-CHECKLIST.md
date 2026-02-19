# Banban Market API Checklist (MVP)

## Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

## Locations
- `GET /api/locations`

## Rooms
- `GET /api/rooms`
- `GET /api/rooms/{roomId}`
- `POST /api/rooms` (인증)
- `POST /api/rooms/{roomId}/join` (인증)
- `POST /api/rooms/{roomId}/participants/{participantUserId}/receive` (인증, 방장)
- `POST /api/rooms/{roomId}/complete` (인증, 방장)

## Reviews
- `POST /api/reviews` (인증)
- `GET /api/reviews/users/{userId}`

## Users
- `GET /api/users/{userId}`
- `GET /api/users/{userId}/rooms/hosted`
- `GET /api/users/{userId}/rooms/participated`
- `GET /api/users/{userId}/reviews`

## 정책 반영 요약
- 방 생성: 점수 80 이상, 미작성 후기 없을 때만 가능
- 거래 장소: `Location` 테이블의 지정 장소만 선택
- 참여: 중복 참여 불가, 방장 참여 불가, 남은 수량 초과 불가
- 자동 마감: 1분마다 마감 시간 지난 OPEN 방을 CLOSED로 변경
- 거래 완료: CLOSED 상태 + 참여자 전원 RECEIVED 이후 가능
- 후기: COMPLETED 방에 대해서만 작성 가능
