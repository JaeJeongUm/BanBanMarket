package com.banban.market.repository;

import com.banban.market.domain.Review;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    boolean existsByRoomIdAndReviewerIdAndRevieweeId(Long roomId, Long reviewerId, Long revieweeId);
    List<Review> findByRevieweeId(Long revieweeId);
    List<Review> findByRoomIdAndReviewerId(Long roomId, Long reviewerId);
}
