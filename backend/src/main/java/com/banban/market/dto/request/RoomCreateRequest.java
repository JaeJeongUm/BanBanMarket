package com.banban.market.dto.request;

import com.banban.market.domain.enums.RoomCategory;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

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
    
    @NotNull
    private Long meetingLocationId;
    
    @NotNull
    private LocalDateTime meetingTime;
    
    @NotNull
    private LocalDateTime deadline;
    
    private String imageUrl;
}
