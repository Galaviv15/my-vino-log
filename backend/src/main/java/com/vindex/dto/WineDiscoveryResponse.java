package com.vindex.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WineDiscoveryResponse {
    
    private Long id;
    
    private String winery;
    
    private String wineName;
    
    private String vintage;
    
    private List<String> grapes;
    
    private String region;
    
    private String country;
    
    @JsonProperty("alcoholContent")
    private Double alcoholContent;
    
    private String source;
    
    @JsonProperty("aiValidated")
    private Boolean aiValidated;
    
    @JsonProperty("createdAt")
    private LocalDateTime createdAt;
}
