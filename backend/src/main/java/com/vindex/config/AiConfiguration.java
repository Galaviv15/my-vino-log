package com.vindex.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AiConfiguration {

    /**
     * Create RestTemplate bean for calling AI APIs
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}


