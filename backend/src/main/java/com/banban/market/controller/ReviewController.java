package com.banban.market.controller;

import com.banban.market.dto.request.ReviewCreateRequest;
import com.banban.market.dto.response.ApiResponse;
import com.banban.market.dto.response.ReviewResponse;
import com.banban.market.security.SecurityUtils;
import com.banban.market.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ApiResponse<ReviewResponse> createReview(@Valid @RequestBody ReviewCreateRequest request) {
        return ApiResponse.ok(reviewService.createReview(SecurityUtils.getCurrentUserId(), request));
    }

    @GetMapping("/users/{userId}")
    public ApiResponse<List<ReviewResponse>> getUserReviews(@PathVariable Long userId) {
        return ApiResponse.ok(reviewService.getUserReviews(userId));
    }
}
