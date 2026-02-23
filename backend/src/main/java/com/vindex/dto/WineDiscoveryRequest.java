package com.vindex.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WineDiscoveryRequest {
    
    private String winery;
    
    private String wineName;
    
    private String vintage; // Can be null or "NV" for non-vintage
}
