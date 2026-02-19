package com.banban.market;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class BanbanMarketApplication {

	public static void main(String[] args) {
		SpringApplication.run(BanbanMarketApplication.class, args);
	}

}
