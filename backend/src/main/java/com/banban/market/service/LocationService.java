package com.banban.market.service;

import com.banban.market.dto.response.LocationResponse;
import com.banban.market.repository.LocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LocationService {

    private final LocationRepository locationRepository;

    public List<LocationResponse> findAll() {
        return locationRepository.findAll().stream()
                .map(LocationResponse::new)
                .collect(Collectors.toList());
    }
}
