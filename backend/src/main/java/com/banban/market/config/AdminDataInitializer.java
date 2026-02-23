package com.banban.market.config;

import com.banban.market.domain.User;
import com.banban.market.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class AdminDataInitializer {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    @Profile("dev")
    public CommandLineRunner seedAdminUser() {
        return args -> {
            if (userRepository.existsByEmail("admin")) {
                return;
            }

            User admin = new User();
            admin.setEmail("admin");
            admin.setNickname("admin");
            admin.setPassword(passwordEncoder.encode("admin"));
            admin.setScore(100);
            admin.setIsActive(true);
            admin.setPendingReviewCount(0);
            userRepository.save(admin);
        };
    }
}
