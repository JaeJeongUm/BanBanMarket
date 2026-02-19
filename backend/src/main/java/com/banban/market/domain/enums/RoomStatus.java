package com.banban.market.domain.enums;

public enum RoomStatus {
    OPEN,       // 모집중
    CLOSED,     // 마감 (수량 달성 또는 시간 마감)
    COMPLETED,  // 거래 완료
    CANCELLED   // 취소
}
