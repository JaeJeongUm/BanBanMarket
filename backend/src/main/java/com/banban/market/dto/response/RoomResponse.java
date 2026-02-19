package com.banban.market.dto.response;

import com.banban.market.domain.Room;
import com.banban.market.domain.enums.RoomCategory;
import com.banban.market.domain.enums.RoomStatus;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class RoomResponse {
    private Long id;
    private String title;
    private String description;
    private RoomCategory category;
    private Long hostId;
    private String hostNickname;
    private Integer hostScore;
    private Integer targetQuantity;
    private Integer currentQuantity;
    private String unit;
    private Integer priceTotal;
    private Integer pricePerUnit;
    private LocationResponse meetingLocation;
    private LocalDateTime meetingTime;
    private LocalDateTime deadline;
    private RoomStatus status;
    private String imageUrl;
    private LocalDateTime createdAt;
    private Integer participantCount;

    public RoomResponse(Room room) {
        this.id = room.getId();
        this.title = room.getTitle();
        this.description = room.getDescription();
        this.category = room.getCategory();
        this.hostId = room.getHost().getId();
        this.hostNickname = room.getHost().getNickname();
        this.hostScore = room.getHost().getScore();
        this.targetQuantity = room.getTargetQuantity();
        this.currentQuantity = room.getCurrentQuantity();
        this.unit = room.getUnit();
        this.priceTotal = room.getPriceTotal();
        this.pricePerUnit = room.getPricePerUnit();
        this.meetingLocation = new LocationResponse(room.getMeetingLocation());
        this.meetingTime = room.getMeetingTime();
        this.deadline = room.getDeadline();
        this.status = room.getStatus();
        this.imageUrl = room.getImageUrl();
        this.createdAt = room.getCreatedAt();
        this.participantCount = room.getParticipants() != null ? room.getParticipants().size() : 0;
    }
}
