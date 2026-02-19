package com.banban.market.dto.response;

import com.banban.market.domain.Review;
import com.banban.market.domain.enums.ReviewType;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class ReviewResponse {
    private Long id;
    private Long roomId;
    private Long reviewerId;
    private String reviewerNickname;
    private Long revieweeId;
    private String revieweeNickname;
    private Short rating;
    private String comment;
    private ReviewType type;
    private LocalDateTime createdAt;

    public ReviewResponse(Review review) {
        this.id = review.getId();
        this.roomId = review.getRoom().getId();
        this.reviewerId = review.getReviewer().getId();
        this.reviewerNickname = review.getReviewer().getNickname();
        this.revieweeId = review.getReviewee().getId();
        this.revieweeNickname = review.getReviewee().getNickname();
        this.rating = review.getRating();
        this.comment = review.getComment();
        this.type = review.getType();
        this.createdAt = review.getCreatedAt();
    }
}
