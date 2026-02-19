package com.banban.market.controller;

import com.banban.market.dto.response.ApiResponse;
import com.banban.market.dto.response.LocationResponse;
import com.banban.market.service.LocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/locations")
public class LocationController {

    private final LocationService locationService;

    @GetMapping
    public ApiResponse<List<LocationResponse>> getLocations() {
        return ApiResponse.ok(locationService.findAll());
    }
}
