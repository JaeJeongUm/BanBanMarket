package com.banban.market.dto.response;

import com.banban.market.domain.Location;
import com.banban.market.domain.enums.LocationType;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class LocationResponse {
    private Long id;
    private String name;
    private String address;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private LocationType locationType;

    public LocationResponse(Location location) {
        this.id = location.getId();
        this.name = location.getName();
        this.address = location.getAddress();
        this.latitude = location.getLatitude();
        this.longitude = location.getLongitude();
        this.locationType = location.getLocationType();
    }
}
