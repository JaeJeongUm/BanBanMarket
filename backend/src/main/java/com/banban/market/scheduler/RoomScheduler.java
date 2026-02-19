package com.banban.market.scheduler;

import com.banban.market.service.RoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class RoomScheduler {

    private final RoomService roomService;

    @Scheduled(fixedDelay = 60000)
    public void closeExpiredRooms() {
        int closedCount = roomService.closeExpiredOpenRooms();
        if (closedCount > 0) {
            log.info("Closed {} expired rooms", closedCount);
        }
    }
}
