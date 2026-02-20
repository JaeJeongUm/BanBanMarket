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
                    // 강남·서초·송파
                    create("강남역 11번 출구", "서울 강남구 강남대로 396", "37.4981640", "127.0276368", LocationType.SUBWAY_STATION),
                    create("이마트 역삼점 입구", "서울 강남구 역삼로 310", "37.4999890", "127.0505740", LocationType.LARGE_MART),
                    create("서초구청 앞", "서울 서초구 남부순환로 2584", "37.4835930", "127.0326510", LocationType.COMMUNITY_CENTER),
                    create("양재 시민의숲 입구", "서울 서초구 매헌로 99", "37.4708620", "127.0351570", LocationType.PARK),
                    create("잠실새내역 4번 출구", "서울 송파구 올림픽로 140", "37.5110740", "127.0866650", LocationType.SUBWAY_STATION),
                    // 마포·홍대·합정
                    create("홍대입구역 9번 출구", "서울 마포구 양화로 188", "37.5572280", "126.9237630", LocationType.SUBWAY_STATION),
                    create("합정역 7번 출구", "서울 마포구 독막로 266", "37.5498370", "126.9147210", LocationType.SUBWAY_STATION),
                    create("망원 한강공원 입구", "서울 마포구 망원동 망원한강공원", "37.5541640", "126.9036480", LocationType.PARK),
                    create("이마트 마포공덕점 입구", "서울 마포구 백범로 212", "37.5468180", "126.9524180", LocationType.LARGE_MART),
                    // 용산·이태원
                    create("이태원역 2번 출구", "서울 용산구 이태원로 203", "37.5346680", "126.9941930", LocationType.SUBWAY_STATION),
                    create("용산구청 앞 광장", "서울 용산구 녹사평대로 150", "37.5326810", "126.9884900", LocationType.COMMUNITY_CENTER),
                    // 성동·성수
                    create("성수역 3번 출구", "서울 성동구 뚝섬로 1나길", "37.5444780", "127.0560170", LocationType.SUBWAY_STATION),
                    create("서울숲 정문", "서울 성동구 뚝섬로 273", "37.5441040", "127.0374720", LocationType.PARK),
                    // 종로·광화문
                    create("광화문역 6번 출구", "서울 종로구 세종대로 198", "37.5747800", "126.9763730", LocationType.SUBWAY_STATION),
                    // 노원·도봉
                    create("노원역 4번 출구", "서울 노원구 노해로 480", "37.6558200", "127.0564600", LocationType.SUBWAY_STATION)
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
