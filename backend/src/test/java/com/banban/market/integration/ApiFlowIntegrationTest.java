package com.banban.market.integration;

import com.banban.market.domain.Location;
import com.banban.market.domain.User;
import com.banban.market.domain.enums.ReviewType;
import com.banban.market.domain.enums.RoomCategory;
import com.banban.market.repository.LocationRepository;
import com.banban.market.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ApiFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LocationRepository locationRepository;

    @Test
    void fullFlow_register_create_join_complete_review_works() throws Exception {
        String hostToken = register("host@banban.test", "hoster", "password123");
        Long hostId = findUserByEmail("host@banban.test").getId();

        User host = findUserByEmail("host@banban.test");
        host.setScore(90);
        userRepository.save(host);

        String participantToken = register("user@banban.test", "buyer", "password123");
        Long participantId = findUserByEmail("user@banban.test").getId();

        Location location = locationRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("Seed location not found"));

        Long roomId = createRoom(hostToken, location.getId());

        joinRoom(participantToken, roomId, 4);

        checkReceive(hostToken, roomId, participantId);

        completeRoom(hostToken, roomId);

        createReview(participantToken, roomId, hostId, (short) 5, ReviewType.FOR_HOST);

        User updatedHost = userRepository.findById(hostId).orElseThrow();
        assertThat(updatedHost.getScore()).isGreaterThanOrEqualTo(92);
    }

    private String register(String email, String nickname, String password) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("email", email);
        body.put("nickname", nickname);
        body.put("password", password);

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        String content = result.getResponse().getContentAsString();
        return JsonPath.read(content, "$.data.token");
    }

    private Long createRoom(String token, Long locationId) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("title", "코스트코 휴지 나눔");
        body.put("description", "대용량 휴지 공동구매");
        body.put("category", RoomCategory.HOUSEHOLD.name());
        body.put("targetQuantity", 4);
        body.put("unit", "개");
        body.put("priceTotal", 40000);
        body.put("meetingLocationId", locationId);
        body.put("meetingTime", LocalDateTime.now().plusDays(1).withNano(0).toString());
        body.put("deadline", LocalDateTime.now().plusHours(1).withNano(0).toString());

        MvcResult result = mockMvc.perform(post("/api/rooms")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        Number roomId = JsonPath.read(result.getResponse().getContentAsString(), "$.data.id");
        return roomId.longValue();
    }

    private void joinRoom(String token, Long roomId, int quantity) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("quantity", quantity);

        mockMvc.perform(post("/api/rooms/{roomId}/join", roomId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    private void checkReceive(String token, Long roomId, Long participantUserId) throws Exception {
        mockMvc.perform(post("/api/rooms/{roomId}/participants/{participantUserId}/receive", roomId, participantUserId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    private void completeRoom(String token, Long roomId) throws Exception {
        mockMvc.perform(post("/api/rooms/{roomId}/complete", roomId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    private void createReview(String token, Long roomId, Long revieweeId, short rating, ReviewType type) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("roomId", roomId);
        body.put("revieweeId", revieweeId);
        body.put("rating", rating);
        body.put("comment", "좋아요");
        body.put("type", type.name());

        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    private User findUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found: " + email));
    }
}
