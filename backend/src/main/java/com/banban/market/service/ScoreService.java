package com.banban.market.service;

import com.banban.market.domain.User;
import com.banban.market.exception.BusinessException;
import com.banban.market.exception.ErrorCode;
import com.banban.market.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ScoreService {

    private final UserRepository userRepository;

    public void applyTransactionComplete(Long userId) {
        adjustScore(userId, +5);
    }

    public void applyGoodReview(Long revieweeId) {
        adjustScore(revieweeId, +2);
    }

    public void applyNoShow(Long userId) {
        adjustScore(userId, -20);
    }

    public void applyBadReview(Long revieweeId) {
        adjustScore(revieweeId, -5);
    }

    private void adjustScore(Long userId, int delta) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        int newScore = Math.max(0, user.getScore() + delta);
        user.setScore(newScore);
        userRepository.save(user);
    }
}
