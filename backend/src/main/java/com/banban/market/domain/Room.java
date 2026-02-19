package com.banban.market.domain;

import com.banban.market.domain.enums.RoomCategory;
import com.banban.market.domain.enums.RoomStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rooms")
@Getter
@Setter
@NoArgsConstructor
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RoomCategory category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_user_id", nullable = false)
    private User host;

    @Column(nullable = false)
    private Integer targetQuantity;

    @Column(nullable = false)
    private Integer currentQuantity = 0;

    @Column(nullable = false, length = 10)
    private String unit;

    @Column(nullable = false)
    private Integer priceTotal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meeting_location_id", nullable = false)
    private Location meetingLocation;

    @Column(nullable = false)
    private LocalDateTime meetingTime;

    @Column(nullable = false)
    private LocalDateTime deadline;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RoomStatus status = RoomStatus.OPEN;

    private String imageUrl;

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<RoomParticipant> participants = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public boolean isFull() {
        return this.currentQuantity >= this.targetQuantity;
    }

    public boolean isOpen() {
        return this.status == RoomStatus.OPEN
                && LocalDateTime.now().isBefore(this.deadline)
                && !isFull();
    }

    public int getPricePerUnit() {
        return (targetQuantity != null && targetQuantity > 0) ? priceTotal / targetQuantity : 0;
    }
}
