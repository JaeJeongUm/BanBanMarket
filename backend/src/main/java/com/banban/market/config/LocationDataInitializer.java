package com.banban.market.config;

import com.banban.market.domain.Location;
import com.banban.market.domain.enums.LocationType;
import com.banban.market.repository.LocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.math.BigDecimal;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class LocationDataInitializer {

    private final LocationRepository locationRepository;

    @Bean
    @Profile("dev")
    public CommandLineRunner seedLocations() {
        return args -> {
            if (locationRepository.count() > 0) {
                return;
            }

            List<Location> locations = List.of(
                    create("강남역 11번 출구", "서울 강남구 강남대로 396", "37.4981640", "127.0276368", LocationType.SUBWAY_STATION),
                    create("이마트 역삼점 입구", "서울 강남구 역삼로 310", "37.4999890", "127.0505740", LocationType.LARGE_MART),
                    create("서초구청 앞", "서울 서초구 남부순환로 2584", "37.4835930", "127.0326510", LocationType.COMMUNITY_CENTER),
                    create("양재 시민의숲 입구", "서울 서초구 매헌로 99", "37.4708620", "127.0351570", LocationType.PARK),
                    create("잠실새내역 4번 출구", "서울 송파구 올림픽로 140", "37.5110740", "127.0866650", LocationType.SUBWAY_STATION)
            );

            locationRepository.saveAll(locations);
        };
    }

    private Location create(String name, String address, String lat, String lon, LocationType type) {
        Location location = new Location();
        location.setName(name);
        location.setAddress(address);
        location.setLatitude(new BigDecimal(lat));
        location.setLongitude(new BigDecimal(lon));
        location.setLocationType(type);
        return location;
    }
}
