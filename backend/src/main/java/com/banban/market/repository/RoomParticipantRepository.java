package com.banban.market.repository;

import com.banban.market.domain.RoomParticipant;
import com.banban.market.domain.enums.ParticipantStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoomParticipantRepository extends JpaRepository<RoomParticipant, Long> {
    boolean existsByRoomIdAndUserId(Long roomId, Long userId);
    Optional<RoomParticipant> findByRoomIdAndUserId(Long roomId, Long userId);
    List<RoomParticipant> findByRoomId(Long roomId);
    List<RoomParticipant> findByRoomIdAndStatus(Long roomId, ParticipantStatus status);
    List<RoomParticipant> findByUserId(Long userId);
}
