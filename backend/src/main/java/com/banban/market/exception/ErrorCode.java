package com.banban.market.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    // Auth
    EMAIL_ALREADY_EXISTS(400, "이미 사용 중인 이메일입니다"),
    NICKNAME_ALREADY_EXISTS(400, "이미 사용 중인 닉네임입니다"),
    INVALID_CREDENTIALS(401, "이메일 또는 비밀번호가 올바르지 않습니다"),

    // Room
    ROOM_NOT_FOUND(404, "존재하지 않는 방입니다"),
    ROOM_NOT_OPEN(400, "참여할 수 없는 방입니다 (마감 또는 완료)"),
    ROOM_NOT_COMPLETED(400, "완료된 거래에만 후기를 작성할 수 있습니다"),
    ROOM_NOT_CLOSED(400, "마감된 방만 거래 완료 처리가 가능합니다"),
    HOST_CANNOT_JOIN(400, "방장은 자신의 방에 참여할 수 없습니다"),
    ALREADY_JOINED(400, "이미 참여한 방입니다"),
    QUANTITY_EXCEEDED(400, "요청 수량이 남은 수량을 초과합니다"),
    NOT_PARTICIPANT(400, "해당 방의 참여자가 아닙니다"),

    // User / Score
    USER_NOT_FOUND(404, "존재하지 않는 사용자입니다"),
    INSUFFICIENT_SCORE(403, "방 개설을 위해 점수 80점 이상이 필요합니다"),
    PENDING_REVIEW_REQUIRED(403, "미작성 후기를 먼저 완료해 주세요"),

    // Review
    REVIEW_ALREADY_EXISTS(400, "이미 후기를 작성하셨습니다"),

    // Location
    LOCATION_NOT_FOUND(404, "존재하지 않는 거래 장소입니다"),

    // Generic
    PARTICIPANT_NOT_FOUND(404, "참여자를 찾을 수 없습니다"),
    UNAUTHORIZED_ACTION(403, "권한이 없는 작업입니다"),
    INTERNAL_ERROR(500, "서버 내부 오류가 발생했습니다");

    private final int status;
    private final String message;
}
