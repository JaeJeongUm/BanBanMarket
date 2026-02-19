package com.banban.market.service;

import com.banban.market.domain.Location;
import com.banban.market.domain.Room;
import com.banban.market.domain.RoomParticipant;
import com.banban.market.domain.User;
import com.banban.market.domain.enums.ParticipantStatus;
import com.banban.market.domain.enums.RoomCategory;
import com.banban.market.domain.enums.RoomStatus;
import com.banban.market.dto.request.JoinRoomRequest;
import com.banban.market.dto.request.RoomCreateRequest;
import com.banban.market.dto.response.RoomDetailResponse;
import com.banban.market.dto.response.RoomResponse;
import com.banban.market.exception.BusinessException;
import com.banban.market.exception.ErrorCode;
import com.banban.market.repository.LocationRepository;
import com.banban.market.repository.RoomParticipantRepository;
import com.banban.market.repository.RoomRepository;
import com.banban.market.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class RoomService {

    private final RoomRepository roomRepository;
    private final UserRepository userRepository;
    private final LocationRepository locationRepository;
    private final RoomParticipantRepository roomParticipantRepository;
    private final ScoreService scoreService;

    @Transactional(readOnly = true)
    public List<RoomResponse> findRooms(RoomCategory category, Long locationId, RoomStatus status, int page, int size) {
        return roomRepository.findByFilters(
                        category,
                        locationId,
                        status,
                        PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))
                )
                .stream()
                .map(RoomResponse::new)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RoomDetailResponse findRoomDetail(Long roomId, Long currentUserId) {
        Room room = findRoomById(roomId);
        return new RoomDetailResponse(room, currentUserId);
    }

    public RoomResponse createRoom(Long currentUserId, RoomCreateRequest request) {
        User host = userRepository.findById(currentUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if (!host.canCreateRoom()) {
            throw new BusinessException(ErrorCode.INSUFFICIENT_SCORE);
        }
        if (host.hasBlockingPendingReviews()) {
            throw new BusinessException(ErrorCode.PENDING_REVIEW_REQUIRED);
        }

        Location meetingLocation = locationRepository.findById(request.getMeetingLocationId())
                .orElseThrow(() -> new BusinessException(ErrorCode.LOCATION_NOT_FOUND));

        Room room = new Room();
        room.setTitle(request.getTitle());
        room.setDescription(request.getDescription());
        room.setCategory(request.getCategory());
        room.setHost(host);
        room.setTargetQuantity(request.getTargetQuantity());
        room.setCurrentQuantity(0);
        room.setUnit(request.getUnit());
        room.setPriceTotal(request.getPriceTotal());
        room.setMeetingLocation(meetingLocation);
        room.setMeetingTime(request.getMeetingTime());
        room.setDeadline(request.getDeadline());
        room.setStatus(RoomStatus.OPEN);
        room.setImageUrl(request.getImageUrl());

        return new RoomResponse(roomRepository.save(room));
    }

    public RoomDetailResponse joinRoom(Long currentUserId, Long roomId, JoinRoomRequest request) {
        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        if (user.hasBlockingPendingReviews()) {
            throw new BusinessException(ErrorCode.PENDING_REVIEW_REQUIRED);
        }

        Room room = findRoomById(roomId);

        if (!room.isOpen()) {
            throw new BusinessException(ErrorCode.ROOM_NOT_OPEN);
        }
        if (room.getHost().getId().equals(currentUserId)) {
            throw new BusinessException(ErrorCode.HOST_CANNOT_JOIN);
        }
        if (roomParticipantRepository.existsByRoomIdAndUserId(roomId, currentUserId)) {
            throw new BusinessException(ErrorCode.ALREADY_JOINED);
        }

        int remaining = room.getTargetQuantity() - room.getCurrentQuantity();
        if (request.getQuantity() > remaining) {
            throw new BusinessException(ErrorCode.QUANTITY_EXCEEDED);
        }

        RoomParticipant participant = new RoomParticipant();
        participant.setRoom(room);
        participant.setUser(user);
        participant.setQuantity(request.getQuantity());
        participant.setStatus(ParticipantStatus.JOINED);
        roomParticipantRepository.save(participant);

        room.setCurrentQuantity(room.getCurrentQuantity() + request.getQuantity());
        if (room.isFull()) {
            room.setStatus(RoomStatus.CLOSED);
        }

        return new RoomDetailResponse(room, currentUserId);
    }

    public RoomDetailResponse checkReceived(Long currentUserId, Long roomId, Long participantUserId) {
        Room room = findRoomById(roomId);
        validateHost(room, currentUserId);

        RoomParticipant participant = roomParticipantRepository
                .findByRoomIdAndUserId(roomId, participantUserId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PARTICIPANT_NOT_FOUND));

        participant.setStatus(ParticipantStatus.RECEIVED);
        return new RoomDetailResponse(room, currentUserId);
    }

    public RoomDetailResponse completeRoom(Long currentUserId, Long roomId) {
        Room room = findRoomById(roomId);
        validateHost(room, currentUserId);

        if (room.getStatus() != RoomStatus.CLOSED) {
            throw new BusinessException(ErrorCode.ROOM_NOT_CLOSED);
        }

        List<RoomParticipant> participants = roomParticipantRepository.findByRoomId(roomId);
        boolean hasUnreceived = participants.stream().anyMatch(p -> p.getStatus() != ParticipantStatus.RECEIVED);
        if (hasUnreceived) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED_ACTION);
        }

        room.setStatus(RoomStatus.COMPLETED);
        scoreService.applyTransactionComplete(room.getHost().getId());

        incrementPendingReview(room.getHost());
        for (RoomParticipant participant : participants) {
            scoreService.applyTransactionComplete(participant.getUser().getId());
            incrementPendingReview(participant.getUser());
        }

        return new RoomDetailResponse(room, currentUserId);
    }

    public int closeExpiredOpenRooms() {
        List<Room> expiredOpenRooms = roomRepository.findByStatusAndDeadlineBefore(RoomStatus.OPEN, LocalDateTime.now());
        for (Room room : expiredOpenRooms) {
            room.setStatus(RoomStatus.CLOSED);
        }
        return expiredOpenRooms.size();
    }

    private Room findRoomById(Long roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new BusinessException(ErrorCode.ROOM_NOT_FOUND));
    }

    private void validateHost(Room room, Long userId) {
        if (!room.getHost().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED_ACTION);
        }
    }

    private void incrementPendingReview(User user) {
        Integer current = user.getPendingReviewCount() == null ? 0 : user.getPendingReviewCount();
        user.setPendingReviewCount(current + 1);
    }
}
