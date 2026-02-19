package com.banban.market.controller;

import com.banban.market.dto.response.ApiResponse;
import com.banban.market.dto.response.ReviewResponse;
import com.banban.market.dto.response.RoomResponse;
import com.banban.market.dto.response.UserResponse;
import com.banban.market.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    @GetMapping("/{userId}")
    public ApiResponse<UserResponse> getUser(@PathVariable Long userId) {
        return ApiResponse.ok(userService.findById(userId));
    }

    @GetMapping("/{userId}/rooms/hosted")
    public ApiResponse<List<RoomResponse>> getHostedRooms(@PathVariable Long userId) {
        return ApiResponse.ok(userService.getMyHostedRooms(userId));
    }

    @GetMapping("/{userId}/rooms/participated")
    public ApiResponse<List<RoomResponse>> getParticipatedRooms(@PathVariable Long userId) {
        return ApiResponse.ok(userService.getMyParticipatedRooms(userId));
    }

    @GetMapping("/{userId}/reviews")
    public ApiResponse<List<ReviewResponse>> getMyReviews(@PathVariable Long userId) {
        return ApiResponse.ok(userService.getMyReviews(userId));
    }
}
