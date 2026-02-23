package com.banban.market.dto.request;

import com.banban.market.domain.enums.RoomCategory;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class RoomCreateRequest {
    @NotBlank
    @Size(max = 100)
    private String title;
    
    private String description;
    
    @NotNull
    private RoomCategory category;
    
    @NotNull
    @Min(1)
    private Integer targetQuantity;
    
    @NotBlank
    private String unit;
    
    @NotNull
    @Min(1)
    private Integer priceTotal;
    
    private Long meetingLocationId;

    @Size(max = 100)
    private String meetingLocationName;

    @Size(max = 255)
    private String meetingLocationAddress;

    private BigDecimal meetingLatitude;

    private BigDecimal meetingLongitude;
    
    @NotNull
    private LocalDateTime meetingTime;
    
    @NotNull
    private LocalDateTime deadline;
    
    private String imageUrl;
}
