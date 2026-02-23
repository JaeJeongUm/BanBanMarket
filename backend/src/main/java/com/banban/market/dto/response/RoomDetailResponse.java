package com.banban.market.dto.response;

import com.banban.market.domain.Room;
import lombok.Getter;

import java.util.List;
import java.util.stream.Collectors;

@Getter
public class RoomDetailResponse extends RoomResponse {
    private List<ParticipantResponse> participants;
    private boolean canJoin;
    private boolean isHost;
    private String joinFailReason; // null이면 참여 가능, 값이 있으면 해당 이유로 참여 불가

    /**
     * 기존 생성자 (하위 호환 유지). joinFailReason 없이 canJoin만 계산.
     */
    public RoomDetailResponse(Room room, Long currentUserId) {
        this(room, currentUserId, null);
    }

    /**
     * joinFailReason을 포함한 생성자. RoomService에서 이유를 계산하여 주입.
     */
    public RoomDetailResponse(Room room, Long currentUserId, String joinFailReason) {
        super(room);
        this.participants = room.getParticipants().stream()
                .map(ParticipantResponse::new)
                .collect(Collectors.toList());
        this.isHost = currentUserId != null && room.getHost().getId().equals(currentUserId);
        this.joinFailReason = joinFailReason;
        // joinFailReason이 있으면 반드시 canJoin=false, 없으면 기존 로직으로 판단
        if (joinFailReason != null) {
            this.canJoin = false;
        } else {
            this.canJoin = room.isOpen()
                    && !this.isHost
                    && (currentUserId == null || room.getParticipants().stream()
                            .noneMatch(p -> p.getUser().getId().equals(currentUserId)));
        }
    }
}
