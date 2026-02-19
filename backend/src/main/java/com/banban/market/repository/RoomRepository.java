package com.banban.market.repository;

import com.banban.market.domain.Room;
import com.banban.market.domain.enums.RoomCategory;
import com.banban.market.domain.enums.RoomStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long> {

    @Query("SELECT r FROM Room r WHERE " +
            "(:category IS NULL OR r.category = :category) AND " +
            "(:locationId IS NULL OR r.meetingLocation.id = :locationId) AND " +
            "(:status IS NULL OR r.status = :status) " +
            "ORDER BY r.createdAt DESC")
    Page<Room> findByFilters(
            @Param("category") RoomCategory category,
            @Param("locationId") Long locationId,
            @Param("status") RoomStatus status,
            Pageable pageable);

    List<Room> findByStatusAndDeadlineBefore(RoomStatus status, LocalDateTime deadline);

    List<Room> findByHostId(Long hostId);

    @Query("SELECT r FROM Room r JOIN r.participants p WHERE p.user.id = :userId")
    List<Room> findRoomsParticipatedByUser(@Param("userId") Long userId);
}
