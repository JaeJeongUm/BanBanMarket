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

    public RoomDetailResponse(Room room, Long currentUserId) {
        super(room);
        this.participants = room.getParticipants().stream()
                .map(ParticipantResponse::new)
                .collect(Collectors.toList());
        this.isHost = room.getHost().getId().equals(currentUserId);
        this.canJoin = room.isOpen()
                && !this.isHost
                && (currentUserId == null || room.getParticipants().stream()
                        .noneMatch(p -> p.getUser().getId().equals(currentUserId)));
    }
}
