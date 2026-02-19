package com.banban.market.controller;

import com.banban.market.domain.enums.RoomCategory;
import com.banban.market.domain.enums.RoomStatus;
import com.banban.market.dto.request.JoinRoomRequest;
import com.banban.market.dto.request.RoomCreateRequest;
import com.banban.market.dto.response.ApiResponse;
import com.banban.market.dto.response.RoomDetailResponse;
import com.banban.market.dto.response.RoomResponse;
import com.banban.market.security.SecurityUtils;
import com.banban.market.service.RoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/rooms")
public class RoomController {

    private final RoomService roomService;

    @GetMapping
    public ApiResponse<List<RoomResponse>> getRooms(
            @RequestParam(required = false) RoomCategory category,
            @RequestParam(required = false) Long locationId,
            @RequestParam(required = false) RoomStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.ok(roomService.findRooms(category, locationId, status, page, size));
    }

    @GetMapping("/{roomId}")
    public ApiResponse<RoomDetailResponse> getRoomDetail(@PathVariable Long roomId) {
        return ApiResponse.ok(roomService.findRoomDetail(roomId, SecurityUtils.getCurrentUserIdOrNull()));
    }

    @PostMapping
    public ApiResponse<RoomResponse> createRoom(@Valid @RequestBody RoomCreateRequest request) {
        return ApiResponse.ok(roomService.createRoom(SecurityUtils.getCurrentUserId(), request));
    }

    @PostMapping("/{roomId}/join")
    public ApiResponse<RoomDetailResponse> joinRoom(@PathVariable Long roomId, @Valid @RequestBody JoinRoomRequest request) {
        return ApiResponse.ok(roomService.joinRoom(SecurityUtils.getCurrentUserId(), roomId, request));
    }

    @PostMapping("/{roomId}/participants/{participantUserId}/receive")
    public ApiResponse<RoomDetailResponse> checkReceive(@PathVariable Long roomId, @PathVariable Long participantUserId) {
        return ApiResponse.ok(roomService.checkReceived(SecurityUtils.getCurrentUserId(), roomId, participantUserId));
    }

    @PostMapping("/{roomId}/complete")
    public ApiResponse<RoomDetailResponse> completeRoom(@PathVariable Long roomId) {
        return ApiResponse.ok(roomService.completeRoom(SecurityUtils.getCurrentUserId(), roomId));
    }
}
