package com.banban.market.service;

import com.banban.market.domain.Room;
import com.banban.market.domain.User;
import com.banban.market.dto.response.ReviewResponse;
import com.banban.market.dto.response.RoomResponse;
import com.banban.market.dto.response.UserResponse;
import com.banban.market.exception.BusinessException;
import com.banban.market.exception.ErrorCode;
import com.banban.market.repository.ReviewRepository;
import com.banban.market.repository.RoomRepository;
import com.banban.market.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final ReviewRepository reviewRepository;

    public UserResponse findById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return new UserResponse(user);
    }

    public List<RoomResponse> getMyHostedRooms(Long userId) {
        return roomRepository.findByHostId(userId).stream()
                .map(RoomResponse::new)
                .collect(Collectors.toList());
    }

    public List<RoomResponse> getMyParticipatedRooms(Long userId) {
        return roomRepository.findRoomsParticipatedByUser(userId).stream()
                .map(RoomResponse::new)
                .collect(Collectors.toList());
    }

    public List<ReviewResponse> getMyReviews(Long userId) {
        return reviewRepository.findByRevieweeId(userId).stream()
                .map(ReviewResponse::new)
                .collect(Collectors.toList());
    }
}
