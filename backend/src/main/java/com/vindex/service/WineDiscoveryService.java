package com.vindex.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vindex.entity.GlobalWine;
import com.vindex.repository.GlobalWineRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.Year;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.regex.Matcher;
import jakarta.annotation.PostConstruct;

@Service
@Slf4j
@RequiredArgsConstructor
public class WineDiscoveryService {

    private final GlobalWineRepository globalWineRepository;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    // Gemini disabled for now.
    // @Value("${spring.ai.google.genai.api-key}")
    // private String geminiApiKey;

    @Value("${serper.api.key}")
    private String serperApiKey;

    @Value("${serper.api.base-url}")
    private String serperBaseUrl;

    @Value("${serper.api.timeout-ms:10000}")
    private long serperTimeout;

    @Value("${wine-discovery.validate-before-save:true}")
    private boolean validateBeforeSave;

    @Value("${wine-discovery.max-search-results:3}")
    private int maxSearchResults;

    // @Value("${wine-discovery.gemini-retry-count:2}")
    // private int geminiRetryCount;

    // @Value("${wine-discovery.gemini-retry-delay-ms:2000}")
    // private long geminiRetryDelayMs;

    @PostConstruct
    public void init() {
        log.info("ℹ️ Gemini AI disabled - using Serper parsing only");
    }

    /**
     * Discover wine details: check local DB, search online, validate, and save
     */
    @Transactional
    public GlobalWine discoverWine(String winery, String wineName, String vintage) {
        log.info("Starting wine discovery for: {} {} {}", winery, wineName, vintage);

        // Step 1: Check local global_wines table
        Optional<GlobalWine> existingWine = globalWineRepository
                .findByWineryAndWineNameAndVintage(winery, wineName, vintage);

        if (existingWine.isPresent()) {
            log.info("Wine found in local cache: {}", existingWine.get().getId());
            return existingWine.get();
        }

        // Step 2: Search online via Serper
        String searchQuery = buildSearchQuery(winery, wineName, vintage);
        String searchResults = performSerperSearch(searchQuery);

        if (searchResults == null || searchResults.isEmpty()) {
            log.warn("No search results found for: {} {}", winery, wineName);
            return null;
        }

        // Step 3: Extract details directly from Serper (Gemini disabled)
        GlobalWine discoveredWine = extractWineDetailsWithAI(winery, wineName, vintage, searchResults);

        if (discoveredWine == null) {
            log.warn("Failed to extract wine details from Serper results");
            return null;
        }

        // Step 4: Validate extracted data
        if (validateBeforeSave) {
            if (!validateWineData(discoveredWine)) {
                log.warn("Wine data validation failed for: {} {}", winery, wineName);
                return null;
            }
        }

        // Step 5: Search for wine image
        String imageUrl = searchWineImage(winery, wineName, vintage);
        if (imageUrl != null && !imageUrl.isEmpty()) {
            discoveredWine.setImageUrl(imageUrl);
            log.info("Wine image found: {}", imageUrl);
        } else {
            log.info("No wine image found, will use placeholder");
        }

        // Step 6: Save to database
        GlobalWine savedWine = globalWineRepository.save(discoveredWine);
        log.info("Wine saved successfully with ID: {}", savedWine.getId());

        return savedWine;
    }

    /**
     * Build a search query for Serper
     */
    private String buildSearchQuery(String winery, String wineName, String vintage) {
        if (vintage != null && !vintage.equalsIgnoreCase("NV")) {
            return String.format("%s %s %s wine", winery, wineName, vintage);
        }
        return String.format("%s %s wine", winery, wineName);
    }

    /**
     * Search for wine bottle image using Serper Image Search API
     */
    private String searchWineImage(String winery, String wineName, String vintage) {
        if (serperApiKey == null || serperApiKey.isBlank()) {
            log.warn("Serper API key not configured for image search");
            return null;
        }

        try {
            // Build image search query
            String imageQuery = buildSearchQuery(winery, wineName, vintage) + " bottle";
            
            // Build request headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-API-KEY", serperApiKey);

            // Build request payload for image search
            Map<String, Object> payload = new HashMap<>();
            payload.put("q", imageQuery);
            payload.put("num", 1); // Only need first image result

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            // Use Serper Image Search endpoint
            String imageSearchUrl = "https://google.serper.dev/images";
            log.debug("Calling Serper Image API for query: {}", imageQuery);
            String response = restTemplate.postForObject(imageSearchUrl, request, String.class);

            if (response == null || response.isEmpty()) {
                log.warn("No image search response from Serper");
                return null;
            }

            // Parse response to extract first image URL
            @SuppressWarnings("unchecked")
            Map<String, Object> imageResponse = objectMapper.readValue(response, Map.class);
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> images = (List<Map<String, Object>>) imageResponse.get("images");
            
            if (images != null && !images.isEmpty()) {
                String imageUrl = (String) images.get(0).get("imageUrl");
                log.info("Found wine image: {}", imageUrl);
                return imageUrl;
            }

            log.info("No wine images found in Serper response");
            return null;

        } catch (Exception e) {
            log.error("Error searching for wine image: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Perform search via Serper API using RestTemplate
     */
    private String performSerperSearch(String query) {
        if (serperApiKey == null || serperApiKey.isBlank()) {
            log.warn("Serper API key not configured");
            return null;
        }

        try {
            // Build request headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-API-KEY", serperApiKey);

            // Build request payload
            Map<String, Object> payload = new HashMap<>();
            payload.put("q", query);
            payload.put("num", maxSearchResults);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            log.debug("Calling Serper API for query: {}", query);
            String response = restTemplate.postForObject(serperBaseUrl, request, String.class);

            log.debug("Serper API response: {}", response);
            return response;

        } catch (Exception e) {
            log.error("Error calling Serper API for query: {}", query, e);
            return null;
        }
    }

    /**
     * Extract wine details from Serper results only (Gemini disabled)
     */
    private GlobalWine extractWineDetailsWithAI(String winery, String wineName, String vintage, String searchResults) {
        log.info("📄 Extracting wine details manually from Serper results (length: {} chars)", searchResults.length());
        return extractWineDetailsManually(winery, wineName, vintage, searchResults);
    }

    /*
    // Gemini disabled for now.
    private GlobalWine extractWithGeminiAI(String winery, String wineName, String vintage, String searchResults) throws Exception { ... }
    private String buildGeminiPrompt(String winery, String wineName, String vintage, String searchResults) { ... }
    private Map<String, Object> callGeminiAPI(String prompt) throws Exception { ... }
    private GlobalWine parseGeminiResponse(Map<String, Object> response, String winery, String wineName, String vintage) throws Exception { ... }
    */

    /**
     * Extract wine details manually from Serper search results (fallback)
     */
    private GlobalWine extractWineDetailsManually(String winery, String wineName, String vintage, String searchResults) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> serperResponse = objectMapper.readValue(searchResults, Map.class);
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> organicResults = (List<Map<String, Object>>) serperResponse.get("organic");
            
            if (organicResults == null || organicResults.isEmpty()) {
                log.warn("No organic search results found");
                return null;
            }
            
            // Get the first result (highest relevance)
            Map<String, Object> topResult = organicResults.get(0);
            
            GlobalWine wine = new GlobalWine();
            wine.setWinery(winery);
            wine.setWineName(wineName);
            wine.setVintage(vintage != null ? vintage : "NV");
            wine.setSource("SerperAPI");
            wine.setAiValidated(false);
            
            // Extract grapes from snippet
            String snippet = (String) topResult.getOrDefault("snippet", "");
            log.debug("Snippet for grape extraction: {}", snippet);
            
            List<String> grapes = extractGrapesFromSnippet(snippet);
            wine.setGrapes(grapes);
            
            // Extract alcohol content if available in snippet
            Double alcohol = extractAlcoholFromSnippet(snippet);
            wine.setAlcoholContent(alcohol);
            
            // Extract region from snippet or title
            String region = extractRegionFromSnippet(snippet);
            if (region == null || region.isEmpty()) {
                region = extractRegionFromTitle((String) topResult.getOrDefault("title", ""));
            }
            wine.setRegion(region);
            
            // Extract wine type (RED, WHITE, ROSÉ) from snippet
            String wineType = extractWineTypeFromSnippet(snippet);
            wine.setType(wineType);
            
            // Set country (default to Israel for Israeli wines like Yatir)
            wine.setCountry("Israel");
            
            log.info("✅ Successfully extracted wine details from Serper (manual parsing): {} {} {} - Grapes: {}", 
                    wine.getWinery(), wine.getWineName(), wine.getVintage(), wine.getGrapes());
            
            return wine;
            
        } catch (Exception e) {
            log.error("Error extracting wine details from Serper response", e);
            return null;
        }
    }
    
    /**
     * Extract grape varieties from snippet text
     */
    private List<String> extractGrapesFromSnippet(String snippet) {
        List<String> grapes = new ArrayList<>();
        java.util.Set<String> uniqueGrapes = new java.util.LinkedHashSet<>();
        
        if (snippet == null || snippet.isEmpty()) {
            return grapes;
        }
        
        // Pattern: "Cabernet Sauvignon 38%, Petit Verdot 33%, Merlot 17%, Cabernet Franc 12%"
        // We want to extract the grape names
        String lowerSnippet = snippet.toLowerCase();
        String[] commonGrapes = {
            "cabernet sauvignon", "cabernet franc", "petit verdot", "petite verdot", "merlot", "pinot noir",
            "syrah", "grenache", "carmenere", "tempranillo", "chardonnay", "sauvignon blanc",
            "riesling", "pinot grigio", "gewurztraminer"
        };
        
        for (String grape : commonGrapes) {
            if (lowerSnippet.contains(grape)) {
                // Capitalize properly
                String[] parts = grape.split(" ");
                StringBuilder capitalized = new StringBuilder();
                for (String part : parts) {
                    if (capitalized.length() > 0) capitalized.append(" ");
                    capitalized.append(part.substring(0, 1).toUpperCase()).append(part.substring(1));
                }
                uniqueGrapes.add(capitalized.toString());
            }
        }
        
        grapes.addAll(uniqueGrapes);
        log.debug("Extracted grapes from snippet: {}", grapes);
        return grapes;
    }
    
    /**
     * Extract alcohol content from snippet
     */
    private Double extractAlcoholFromSnippet(String snippet) {
        if (snippet == null || snippet.isEmpty()) {
            return null;
        }
        
        // Look for patterns like "13.5% alcohol", "13.5 ABV", "14% vol", etc.
        // Exclude percentages that come after grape names (like "Cabernet Sauvignon 38%")
        Pattern pattern = Pattern.compile("(\\d+\\.?\\d*)\\s*%\\s*(alcohol|vol|abv|content)?");
        Matcher matcher = pattern.matcher(snippet);
        
        // Find all matches and return the first one that's in valid alcohol range (5-22%)
        while (matcher.find()) {
            try {
                Double value = Double.parseDouble(matcher.group(1));
                // Valid alcohol content should be between 5-22%
                // Grape percentages are typically higher (20-50%)
                if (value >= 5 && value <= 22) {
                    return value;
                }
            } catch (NumberFormatException e) {
                log.debug("Could not parse alcohol content from snippet: {}", snippet);
            }
        }
        
        return null;
    }
    
    /**
     * Extract region from snippet
     */
    private String extractRegionFromSnippet(String snippet) {
        if (snippet == null || snippet.isEmpty()) {
            return null;
        }
        
        // Common wine regions
        String[] regions = {"Judean Hills", "Galilee", "Napa", "Sonoma", "Bordeaux", "Burgundy", "Tuscany"};
        
        for (String region : regions) {
            if (snippet.contains(region)) {
                return region;
            }
        }
        
        return null;
    }
    
    /**
     * Extract region from title (fallback)
     */
    private String extractRegionFromTitle(String title) {
        if (title == null || title.isEmpty()) {
            return "Unknown";
        }
        
        // If title contains region info like "Judean Hills", extract it
        String[] regions = {"Judean Hills", "Galilee", "Napa", "Sonoma", "Bordeaux", "Burgundy", "Tuscany"};
        
        for (String region : regions) {
            if (title.contains(region)) {
                return region;
            }
        }
        
        return "Unknown";
    }

    /*
    // DEPRECATED: Using direct Serper extraction instead of Gemini AI
    
    private String callGeminiAPI(String prompt) { ... }
    
    private String buildAIPrompt(String winery, String wineName, String vintage, String searchResults) { ... }
    
    private GlobalWine parseAIResponse(String aiResponse, String winery, String wineName, String vintage) { ... }
    */

    /**
     * Validate wine data before saving
     */
    private boolean validateWineData(GlobalWine wine) {
        // Check required fields
        if (wine.getWinery() == null || wine.getWinery().isBlank()) {
            log.warn("Validation failed: winery is empty");
            return false;
        }

        if (wine.getWineName() == null || wine.getWineName().isBlank()) {
            log.warn("Validation failed: wine name is empty");
            return false;
        }

        // Validate vintage
        String vintage = wine.getVintage();
        if (vintage == null || vintage.isBlank()) {
            log.warn("Validation failed: vintage is empty");
            return false;
        }

        if (!vintage.equalsIgnoreCase("NV")) {
            try {
                int vintageYear = Integer.parseInt(vintage);
                int currentYear = Year.now().getValue();

                if (vintageYear < 1900 || vintageYear > currentYear) {
                    log.warn("Validation failed: vintage year {} is out of valid range [1900-{}]",
                            vintageYear, currentYear);
                    return false;
                }
            } catch (NumberFormatException e) {
                log.warn("Validation failed: vintage '{}' is not a valid year", vintage);
                return false;
            }
        }

        // Validate alcohol content - can be null for manual parsed wines (fallback mode)
        if (wine.getAlcoholContent() != null) {
            if (wine.getAlcoholContent() < 5 || wine.getAlcoholContent() > 22) {
                log.warn("Validation failed: alcohol content {} is out of valid range [5-22]%",
                        wine.getAlcoholContent());
                return false;
            }
        } else {
            // Log warning but allow wine with missing alcohol (from fallback parsing)
            log.info("⚠️  Wine has no alcohol content (from fallback Serper parsing): {} {} {}", 
                    wine.getWinery(), wine.getWineName(), wine.getVintage());
        }

        log.info("✅ Wine validation passed for: {} {} {}", wine.getWinery(), wine.getWineName(), wine.getVintage());
        return true;
    }

    /**
     * Get wine by ID
     */
    public GlobalWine getWineById(Long id) {
        return globalWineRepository.findById(id).orElse(null);
    }

    /**
     * Search wines by winery
     */
    public List<GlobalWine> searchByWinery(String winery) {
        return globalWineRepository.findByWineryIgnoreCase(winery);
    }

    /**
     * Search wines by name
     */
    public List<GlobalWine> searchByName(String wineName) {
        return globalWineRepository.findByWineNameIgnoreCaseContaining(wineName);
    }

    /**
     * Get all validated wines
     */
    public List<GlobalWine> getAllValidatedWines() {
        return globalWineRepository.findByAiValidatedTrue();
    }

    /**
     * Extract wine type (RED, WHITE, ROSÉ) from snippet
     */
    private String extractWineTypeFromSnippet(String snippet) {
        if (snippet == null || snippet.isEmpty()) {
            return "RED"; // Default fallback
        }
        
        String lowerSnippet = snippet.toLowerCase();
        
        // Check for white wine indicators
        if (lowerSnippet.contains("white wine") || 
            lowerSnippet.contains("sauvignon blanc") || 
            lowerSnippet.contains("chardonnay") || 
            lowerSnippet.contains("riesling") ||
            lowerSnippet.contains("pinot grigio") ||
            lowerSnippet.contains("verdejo")) {
            return "WHITE";
        }
        
        // Check for rosé wine indicators
        if (lowerSnippet.contains("rosé") || 
            lowerSnippet.contains("rose wine") ||
            lowerSnippet.contains("rose")) {
            return "ROSÉ";
        }
        
        // Check for sparkling/champagne
        if (lowerSnippet.contains("sparkling") || 
            lowerSnippet.contains("champagne") ||
            lowerSnippet.contains("prosecco")) {
            return "SPARKLING";
        }
        
        // Default to RED for most wines (most wines are red)
        return "RED";
    }
}
