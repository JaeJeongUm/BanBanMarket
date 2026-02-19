package com.banban.market.dto.request;

import com.banban.market.domain.enums.ReviewType;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReviewCreateRequest {
    @NotNull
    private Long roomId;
    
    @NotNull
    private Long revieweeId;
    
    @NotNull
    @Min(1)
    @Max(5)
    private Short rating;
    
    private String comment;
    
    @NotNull
    private ReviewType type;
}
