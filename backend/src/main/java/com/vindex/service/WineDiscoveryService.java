package com.vindex.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vindex.entity.GlobalWine;
import com.vindex.repository.GlobalWineRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.hc.client5.http.classic.HttpClient;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.Year;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class WineDiscoveryService {

    private final GlobalWineRepository globalWineRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${spring.ai.google.gemini.api-key}")
    private String geminiApiKey;

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

    private static final String GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

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

        // Step 3: Use Gemini AI to extract structured JSON
        GlobalWine discoveredWine = extractWineDetailsWithAI(winery, wineName, vintage, searchResults);

        if (discoveredWine == null) {
            log.warn("Failed to extract wine details with AI");
            return null;
        }

        // Step 4: Validate extracted data
        if (validateBeforeSave) {
            if (!validateWineData(discoveredWine)) {
                log.warn("Wine data validation failed for: {} {}", winery, wineName);
                return null;
            }
        }

        // Step 5: Save to database
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
     * Perform search via Serper API
     */
    private String performSerperSearch(String query) {
        if (serperApiKey == null || serperApiKey.isBlank()) {
            log.warn("Serper API key not configured");
            return null;
        }

        try {
            HttpClient httpClient = HttpClients.createDefault();
            HttpPost httpPost = new HttpPost(serperBaseUrl);
            httpPost.setHeader("X-API-KEY", serperApiKey);
            httpPost.setHeader("Content-Type", "application/json");

            Map<String, Object> payload = new HashMap<>();
            payload.put("q", query);
            payload.put("num", maxSearchResults);

            String jsonPayload = objectMapper.writeValueAsString(payload);
            httpPost.setEntity(new StringEntity(jsonPayload));

            StringBuilder response = new StringBuilder();
            httpClient.execute(httpPost, httpResponse -> {
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(httpResponse.getEntity().getContent()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        response.append(line);
                    }
                }
                return null;
            });

            log.debug("Serper API response: {}", response);
            return response.toString();

        } catch (Exception e) {
            log.error("Error calling Serper API for query: {}", query, e);
            return null;
        }
    }

    /**
     * Use Gemini AI to extract structured wine details from search results
     */
    private GlobalWine extractWineDetailsWithAI(String winery, String wineName, String vintage, String searchResults) {
        String prompt = buildAIPrompt(winery, wineName, vintage, searchResults);

        try {
            String aiResponse = callGeminiAPI(prompt);

            if (aiResponse == null) {
                log.warn("Gemini API returned null response");
                return null;
            }

            log.debug("AI Response: {}", aiResponse);

            // Parse JSON from AI response
            return parseAIResponse(aiResponse, winery, wineName, vintage);

        } catch (Exception e) {
            log.error("Error calling Gemini AI", e);
            return null;
        }
    }

    /**
     * Call Google Gemini API via REST
     */
    private String callGeminiAPI(String prompt) {
        try {
            String url = GEMINI_API_BASE + "?key=" + geminiApiKey;

            // Build request payload
            Map<String, Object> contents = new HashMap<>();
            Map<String, String> parts = new HashMap<>();
            parts.put("text", prompt);
            contents.put("parts", new Object[] { parts });

            Map<String, Object> payload = new HashMap<>();
            payload.put("contents", new Object[] { contents });

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            String requestBody = objectMapper.writeValueAsString(payload);
            log.debug("Sending Gemini API request with body: {}", requestBody);

            HttpEntity<String> request = new HttpEntity<>(requestBody, headers);

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(url, request, Map.class);

            if (response != null && response.containsKey("candidates")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
                if (!candidates.isEmpty()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> candidate = candidates.get(0);
                    if (candidate.containsKey("content")) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> content = (Map<String, Object>) candidate.get("content");
                        if (content.containsKey("parts")) {
                            @SuppressWarnings("unchecked")
                            List<Map<String, String>> parts_list = (List<Map<String, String>>) content.get("parts");
                            if (!parts_list.isEmpty()) {
                                return parts_list.get(0).get("text");
                            }
                        }
                    }
                }
            }

            return null;

        } catch (Exception e) {
            log.error("Error calling Gemini API", e);
            return null;
        }
    }

    /**
     * Build the prompt for Gemini AI
     */
    private String buildAIPrompt(String winery, String wineName, String vintage, String searchResults) {
        return String.format(
                """
                Extract structured wine information from the following search results.
                Return ONLY a valid JSON object with these exact fields (no markdown, no extra text):
                {
                    "winery": "string",
                    "wineName": "string",
                    "vintage": "string (year or 'NV')",
                    "grapes": ["array", "of", "grape", "varieties"],
                    "region": "string",
                    "country": "string",
                    "alcoholContent": "number (5-22)"
                }
                
                Wine to find:
                - Winery: %s
                - Wine Name: %s
                - Vintage: %s
                
                Search Results:
                %s
                
                If information is missing, use reasonable defaults:
                - For vintage: use 'NV' if not found
                - For grapes: use empty array if not found
                - For alcohol content: estimate 12.5 for red wines, 11.5 for white wines if not found
                - For region: use the primary region if not found
                
                Return ONLY the JSON object, nothing else.""",
                winery, wineName, vintage, searchResults);
    }

    /**
     * Parse the AI response JSON
     */
    private GlobalWine parseAIResponse(String aiResponse, String winery, String wineName, String vintage) {
        try {
            // Remove markdown code blocks if present
            String cleanedResponse = aiResponse
                    .replaceAll("```json", "")
                    .replaceAll("```", "")
                    .trim();

            @SuppressWarnings("unchecked")
            Map<String, Object> wineData = objectMapper.readValue(cleanedResponse, Map.class);

            GlobalWine wine = new GlobalWine();
            wine.setWinery((String) wineData.getOrDefault("winery", winery));
            wine.setWineName((String) wineData.getOrDefault("wineName", wineName));
            wine.setVintage((String) wineData.getOrDefault("vintage", vintage != null ? vintage : "NV"));
            wine.setRegion((String) wineData.getOrDefault("region", "Unknown"));
            wine.setCountry((String) wineData.getOrDefault("country", "Unknown"));

            // Parse grapes array
            @SuppressWarnings("unchecked")
            List<String> grapes = (List<String>) wineData.getOrDefault("grapes", new ArrayList<>());
            wine.setGrapes(grapes);

            // Parse alcohol content
            Object alcoholObj = wineData.get("alcoholContent");
            if (alcoholObj != null) {
                Double alcohol = ((Number) alcoholObj).doubleValue();
                wine.setAlcoholContent(alcohol);
            }

            wine.setSource("AI");
            wine.setAiValidated(false); // Will be set to true after validation

            return wine;

        } catch (Exception e) {
            log.error("Error parsing AI response: {}", aiResponse, e);
            return null;
        }
    }

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

        // Validate alcohol content
        if (wine.getAlcoholContent() == null) {
            log.warn("Validation failed: alcohol content is null");
            return false;
        }

        if (wine.getAlcoholContent() < 5 || wine.getAlcoholContent() > 22) {
            log.warn("Validation failed: alcohol content {} is out of valid range [5-22]%",
                    wine.getAlcoholContent());
            return false;
        }

        log.info("Wine validation passed for: {} {} {}", wine.getWinery(), wine.getWineName(), wine.getVintage());
        wine.setAiValidated(true);
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
}
