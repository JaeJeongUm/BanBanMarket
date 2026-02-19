package com.banban.market.service;

import com.banban.market.domain.Review;
import com.banban.market.domain.Room;
import com.banban.market.domain.RoomParticipant;
import com.banban.market.domain.User;
import com.banban.market.domain.enums.ReviewType;
import com.banban.market.domain.enums.RoomStatus;
import com.banban.market.dto.request.ReviewCreateRequest;
import com.banban.market.dto.response.ReviewResponse;
import com.banban.market.exception.BusinessException;
import com.banban.market.exception.ErrorCode;
import com.banban.market.repository.ReviewRepository;
import com.banban.market.repository.RoomParticipantRepository;
import com.banban.market.repository.RoomRepository;
import com.banban.market.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final RoomParticipantRepository roomParticipantRepository;
    private final ScoreService scoreService;

    public ReviewResponse createReview(Long currentUserId, ReviewCreateRequest request) {
        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));

        if (room.getStatus() != RoomStatus.COMPLETED) {
            throw new BusinessException(ErrorCode.ROOM_NOT_COMPLETED);
        }

        User reviewer = userRepository.findById(currentUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        User reviewee = userRepository.findById(request.getRevieweeId())
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        validateReviewRelation(room, reviewer.getId(), reviewee.getId(), request.getType());

        if (reviewRepository.existsByRoomIdAndReviewerIdAndRevieweeId(room.getId(), reviewer.getId(), reviewee.getId())) {
            throw new BusinessException(ErrorCode.REVIEW_ALREADY_EXISTS);
        }

        boolean reviewerAlreadyWroteInThisRoom = !reviewRepository
                .findByRoomIdAndReviewerId(room.getId(), reviewer.getId())
                .isEmpty();

        Review review = new Review();
        review.setRoom(room);
        review.setReviewer(reviewer);
        review.setReviewee(reviewee);
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        review.setType(request.getType());
        review = reviewRepository.save(review);

        if (!reviewerAlreadyWroteInThisRoom) {
            Integer pending = reviewer.getPendingReviewCount() == null ? 0 : reviewer.getPendingReviewCount();
            reviewer.setPendingReviewCount(Math.max(0, pending - 1));
        }

        if (request.getRating() >= 4) {
            scoreService.applyGoodReview(reviewee.getId());
        } else if (request.getRating() <= 2) {
            scoreService.applyBadReview(reviewee.getId());
        }

        return new ReviewResponse(review);
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getUserReviews(Long userId) {
        return reviewRepository.findByRevieweeId(userId).stream()
                .map(ReviewResponse::new)
                .toList();
    }

    private void validateReviewRelation(Room room, Long reviewerId, Long revieweeId, ReviewType type) {
        Long hostId = room.getHost().getId();
        boolean reviewerIsHost = hostId.equals(reviewerId);
        boolean revieweeIsHost = hostId.equals(revieweeId);

        boolean reviewerParticipated = roomParticipantRepository.findByRoomIdAndUserId(room.getId(), reviewerId).isPresent();
        boolean revieweeParticipated = roomParticipantRepository.findByRoomIdAndUserId(room.getId(), revieweeId).isPresent();

        if (type == ReviewType.FOR_HOST) {
            if (!revieweeIsHost || !reviewerParticipated || reviewerIsHost) {
                throw new BusinessException(ErrorCode.UNAUTHORIZED_ACTION);
            }
        } else {
            if (!reviewerIsHost || revieweeIsHost || !revieweeParticipated) {
                throw new BusinessException(ErrorCode.UNAUTHORIZED_ACTION);
            }
        }
    }
}
