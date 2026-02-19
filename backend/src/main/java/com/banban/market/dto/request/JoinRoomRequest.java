package com.banban.market.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class JoinRoomRequest {
    @NotNull
    @Min(1)
    private Integer quantity;
}
