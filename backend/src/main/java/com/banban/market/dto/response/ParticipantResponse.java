package com.banban.market.dto.response;

import com.banban.market.domain.RoomParticipant;
import com.banban.market.domain.enums.ParticipantStatus;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ParticipantResponse {
    private Long userId;
    private String nickname;
    private Integer quantity;
    private ParticipantStatus status;
    private LocalDateTime joinedAt;

    public ParticipantResponse(RoomParticipant p) {
        this.userId = p.getUser().getId();
        this.nickname = p.getUser().getNickname();
        this.quantity = p.getQuantity();
        this.status = p.getStatus();
        this.joinedAt = p.getJoinedAt();
    }
}
