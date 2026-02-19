package com.banban.market.dto.response;

import com.banban.market.domain.User;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class UserResponse {
    private Long id;
    private String nickname;
    private String email;
    private Integer score;
    private String profileImageUrl;
    private Boolean isActive;
    private Integer pendingReviewCount;
    private LocalDateTime createdAt;

    public UserResponse(User user) {
        this.id = user.getId();
        this.nickname = user.getNickname();
        this.email = user.getEmail();
        this.score = user.getScore();
        this.profileImageUrl = user.getProfileImageUrl();
        this.isActive = user.getIsActive();
        this.pendingReviewCount = user.getPendingReviewCount();
        this.createdAt = user.getCreatedAt();
    }
}
