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
     * Extract wine details manually from Serper search results using multi-source validation (top 3 results)
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
            
            log.info("🔍 Processing {} search results for multi-source extraction", Math.min(maxSearchResults, organicResults.size()));
            
            // Extract data from multiple sources (top 3 results)
            List<WineCandidate> candidates = new ArrayList<>();
            
            for (int i = 0; i < Math.min(maxSearchResults, organicResults.size()); i++) {
                Map<String, Object> result = organicResults.get(i);
                String title = (String) result.getOrDefault("title", "");
                String snippet = (String) result.getOrDefault("snippet", "");
                String url = (String) result.getOrDefault("link", "");
                
                log.info("📄 Source {}: {} | URL: {}", i + 1, title, url);
                
                WineCandidate candidate = extractFromSingleSource(result, winery, wineName, vintage, i + 1);
                if (candidate != null) {
                    candidates.add(candidate);
                }
            }
            
            if (candidates.isEmpty()) {
                log.warn("No valid wine data extracted from any source");
                return null;
            }
            
            // Cross-validate and choose best data from all sources
            GlobalWine wine = buildFinalWineFromCandidates(candidates, winery, wineName, vintage);
            
            log.info("✅ Multi-source extraction complete: {} {} {} - Sources used: {}", 
                    wine.getWinery(), wine.getWineName(), wine.getVintage(), candidates.size());
            
            return wine;
            
        } catch (Exception e) {
            log.error("Error extracting wine details from Serper response", e);
            return null;
        }
    }
    
    /**
     * Extract wine data from a single Serper result
     */
    private WineCandidate extractFromSingleSource(Map<String, Object> result, String originalWinery, String originalWineName, String vintage, int sourceIndex) {
        try {
            String title = (String) result.getOrDefault("title", "");
            String snippet = (String) result.getOrDefault("snippet", "");
            String url = (String) result.getOrDefault("link", "");
            
            WineCandidate candidate = new WineCandidate();
            candidate.sourceIndex = sourceIndex;
            candidate.sourceUrl = url;
            candidate.title = title;
            candidate.snippet = snippet;
            
            // Extract names with fallback corrections
            try {
                candidate.winery = extractWineryFromTitle(title, originalWinery);
                log.debug("Source {}: Winery '{}' -> '{}'", sourceIndex, originalWinery, candidate.winery);
            } catch (Exception e) {
                candidate.winery = capitalizeWineName(originalWinery);
                log.debug("Source {}: Winery extraction failed, using fallback: '{}'", sourceIndex, candidate.winery);
            }
            
            try {
                candidate.wineName = extractWineNameFromTitle(title, originalWineName);
                log.debug("Source {}: Wine name '{}' -> '{}'", sourceIndex, originalWineName, candidate.wineName);
            } catch (Exception e) {
                candidate.wineName = capitalizeWineName(originalWineName);
                log.debug("Source {}: Wine name extraction failed, using fallback: '{}'", sourceIndex, candidate.wineName);
            }
            
            // Extract additional data from snippet
            candidate.grapes = extractGrapesFromSnippet(snippet);
            candidate.alcohol = extractAlcoholFromSnippet(snippet);
            candidate.region = extractRegionFromSnippet(snippet);
            candidate.wineType = extractWineTypeFromSnippet(snippet);
            
            // Calculate quality score for this candidate
            candidate.qualityScore = calculateCandidateQuality(candidate, originalWinery, originalWineName);
            
            log.debug("Source {}: Quality score = {}, Data: {} | {} | Type: {} | Grapes: {} | Alcohol: {}%", 
                    sourceIndex, candidate.qualityScore, candidate.winery, candidate.wineName, 
                    candidate.wineType, candidate.grapes, candidate.alcohol);
            
            return candidate;
            
        } catch (Exception e) {
            log.warn("Failed to extract from source {}: {}", sourceIndex, e.getMessage());
            return null;
        }
    }
    
    /**
     * Build final wine object by cross-validating data from multiple candidates
     */
    private GlobalWine buildFinalWineFromCandidates(List<WineCandidate> candidates, String originalWinery, String originalWineName, String vintage) {
        GlobalWine wine = new GlobalWine();
        
        // Choose best winery name (highest quality score with valid winery)
        WineCandidate bestWineryCandidate = candidates.stream()
                .filter(c -> c.winery != null && !c.winery.trim().isEmpty())
                .max((c1, c2) -> Integer.compare(c1.qualityScore, c2.qualityScore))
                .orElse(candidates.get(0));
        
        wine.setWinery(bestWineryCandidate.winery);
        log.info("🏆 Best winery from source {}: '{}'", bestWineryCandidate.sourceIndex, wine.getWinery());
        
        // Choose best wine name (cross-validate for spelling corrections)
        String bestWineName = chooseBestWineName(candidates, originalWineName);
        wine.setWineName(bestWineName);
        log.info("🏆 Best wine name: '{}'", bestWineName);
        
        // Set basic properties
        wine.setVintage(vintage != null ? vintage : "NV");
        wine.setSource("SerperAPI");
        wine.setAiValidated(false);
        wine.setCountry("Israel"); // Default for Israeli wines
        
        // Choose best additional data from candidates
        wine.setGrapes(chooseBestGrapes(candidates));
        wine.setAlcoholContent(chooseBestAlcohol(candidates));
        wine.setRegion(chooseBestRegion(candidates));
        wine.setType(chooseBestWineType(candidates));
        
        return wine;
    }
    
    /**
     * Choose the best wine name from multiple candidates using cross-validation
     */
    private String chooseBestWineName(List<WineCandidate> candidates, String originalWineName) {
        Map<String, Integer> nameFrequency = new HashMap<>();
        Map<String, Integer> nameQuality = new HashMap<>();
        
        // Count frequency and track quality scores
        for (WineCandidate candidate : candidates) {
            if (candidate.wineName != null && !candidate.wineName.trim().isEmpty()) {
                String name = candidate.wineName.trim();
                nameFrequency.put(name, nameFrequency.getOrDefault(name, 0) + 1);
                nameQuality.put(name, Math.max(nameQuality.getOrDefault(name, 0), candidate.qualityScore));
            }
        }
        
        if (nameFrequency.isEmpty()) {
            return capitalizeWineName(originalWineName);
        }
        
        // Find most frequent name with highest quality
        String bestName = nameFrequency.entrySet().stream()
                .max((e1, e2) -> {
                    // First compare by frequency, then by quality
                    int freqCompare = Integer.compare(e1.getValue(), e2.getValue());
                    if (freqCompare != 0) return freqCompare;
                    return Integer.compare(nameQuality.get(e1.getKey()), nameQuality.get(e2.getKey()));
                })
                .map(Map.Entry::getKey)
                .orElse(capitalizeWineName(originalWineName));
        
        log.info("🔍 Wine name analysis: {} candidates, best: '{}' (frequency: {}, quality: {})", 
                nameFrequency.size(), bestName, nameFrequency.get(bestName), nameQuality.get(bestName));
        
        return bestName;
    }
    
    /**
     * Calculate quality score for a wine candidate
     */
    private int calculateCandidateQuality(WineCandidate candidate, String originalWinery, String originalWineName) {
        int score = 0;
        
        // Base score for having data
        if (candidate.winery != null && !candidate.winery.trim().isEmpty()) score += 10;
        if (candidate.wineName != null && !candidate.wineName.trim().isEmpty()) score += 10;
        
        // Bonus for matching or similar names
        if (candidate.winery != null && containsIgnoreCase(candidate.winery, originalWinery)) score += 20;
        if (candidate.wineName != null && containsIgnoreCase(candidate.wineName, originalWineName)) score += 20;
        
        // Bonus for additional data
        if (candidate.grapes != null && !candidate.grapes.isEmpty()) score += 5;
        if (candidate.alcohol != null) score += 5;
        if (candidate.region != null && !candidate.region.trim().isEmpty()) score += 5;
        if (candidate.wineType != null && !candidate.wineType.trim().isEmpty()) score += 5;
        
        // Bonus for wine-specific URLs (e.g., wine shops, wine databases)
        if (candidate.sourceUrl != null) {
            String url = candidate.sourceUrl.toLowerCase();
            if (url.contains("wine") || url.contains("vivino") || url.contains("cellar") || url.contains("bottle")) {
                score += 15;
            }
        }
        
        return score;
    }
    
    // Helper methods for choosing best data from candidates
    private List<String> chooseBestGrapes(List<WineCandidate> candidates) {
        return candidates.stream()
                .filter(c -> c.grapes != null && !c.grapes.isEmpty())
                .findFirst()
                .map(c -> c.grapes)
                .orElse(new ArrayList<>());
    }
    
    private Double chooseBestAlcohol(List<WineCandidate> candidates) {
        return candidates.stream()
                .filter(c -> c.alcohol != null)
                .findFirst()
                .map(c -> c.alcohol)
                .orElse(null);
    }
    
    private String chooseBestRegion(List<WineCandidate> candidates) {
        return candidates.stream()
                .filter(c -> c.region != null && !c.region.trim().isEmpty())
                .findFirst()
                .map(c -> c.region)
                .orElse("Unknown");
    }
    
    private String chooseBestWineType(List<WineCandidate> candidates) {
        return candidates.stream()
                .filter(c -> c.wineType != null && !c.wineType.trim().isEmpty())
                .findFirst()
                .map(c -> c.wineType)
                .orElse("RED"); // Default for Israeli wines
    }
    
    private boolean containsIgnoreCase(String text, String searchStr) {
        if (text == null || searchStr == null) return false;
        return text.toLowerCase().contains(searchStr.toLowerCase()) || 
               searchStr.toLowerCase().contains(text.toLowerCase());
    }
    
    /**
     * Inner class to hold wine candidate data from each source
     */
    private static class WineCandidate {
        int sourceIndex;
        String sourceUrl;
        String title;
        String snippet;
        String winery;
        String wineName;
        List<String> grapes;
        Double alcohol;
        String region;
        String wineType;
        int qualityScore;
    }
    
    /**
     * Calculate Levenshtein distance for fuzzy string matching
     */
    private int calculateLevenshteinDistance(String s1, String s2) {
        if (s1 == null || s2 == null) return Integer.MAX_VALUE;
        
        s1 = s1.toLowerCase();
        s2 = s2.toLowerCase();
        
        int[][] dp = new int[s1.length() + 1][s2.length() + 1];
        
        for (int i = 0; i <= s1.length(); i++) {
            for (int j = 0; j <= s2.length(); j++) {
                if (i == 0) {
                    dp[i][j] = j;
                } else if (j == 0) {
                    dp[i][j] = i;
                } else {
                    dp[i][j] = Math.min(Math.min(
                        dp[i - 1][j] + 1,
                        dp[i][j - 1] + 1),
                        dp[i - 1][j - 1] + (s1.charAt(i - 1) == s2.charAt(j - 1) ? 0 : 1)
                    );
                }
            }
        }
        
        return dp[s1.length()][s2.length()];
    }
    
    /**
     * Find best matching word in title using fuzzy matching
     */
    private String findBestMatchInTitle(String title, String userInput, String[] knownPatterns) {
        if (title == null || title.isEmpty() || userInput == null) {
            return null;
        }
        
        String[] titleWords = title.split("[\\\\s\\\\-,\\\\.]+");
        String bestMatch = null;
        int bestScore = Integer.MAX_VALUE;
        int maxAllowedDistance = Math.max(1, userInput.length() / 3); // Allow up to 1/3 of characters to be different
        
        // First, check known patterns with fuzzy matching
        for (String pattern : knownPatterns) {
            int distance = calculateLevenshteinDistance(userInput, pattern);
            if (distance <= maxAllowedDistance && distance < bestScore) {
                // Find this pattern in the title with proper capitalization
                for (String word : titleWords) {
                    if (calculateLevenshteinDistance(pattern, word) <= 1) {
                        bestMatch = word;
                        bestScore = distance;
                        break;
                    }
                }
            }
        }
        
        // Then check all words in title for fuzzy matches
        for (String word : titleWords) {
            if (word.length() >= 2) { // Ignore very short words
                int distance = calculateLevenshteinDistance(userInput, word);
                if (distance <= maxAllowedDistance && distance < bestScore) {
                    bestMatch = word;
                    bestScore = distance;
                }
            }
        }
        
        return bestMatch;
    }
    
    /**
     * Extract winery name from search result title using fuzzy matching
     */
    private String extractWineryFromTitle(String title, String userInputWinery) {
        if (title == null || title.isEmpty() || userInputWinery == null) {
            return capitalizeWineName(userInputWinery);
        }
        
        // Common winery patterns in titles
        String[] wineryPatterns = {
            "Gamla", "Yarden", "Carmel", "Barkan", "Recanati", "Margalit", "Yatir",
            "Domaine de la", "Château", "Clos de", "Mas de", "Bodega", "Bodegas",
            "Teperberg", "Galil", "Efrat", "Psagot", "Shvo", "Tulip", "Vitkin",
            "Amphorae", "Pelter", "Sphera", "Tabor", "Tishbi", "Tzora"
        };
        
        // Try fuzzy matching
        String bestMatch = findBestMatchInTitle(title, userInputWinery, wineryPatterns);
        if (bestMatch != null) {
            return bestMatch;
        }
        
        // Fallback: look for exact substring match with proper capitalization
        String lowerTitle = title.toLowerCase();
        String lowerUserInput = userInputWinery.toLowerCase();
        String[] titleWords = title.split("\\s+");
        
        for (String word : titleWords) {
            if (word.toLowerCase().contains(lowerUserInput) && word.length() >= lowerUserInput.length()) {
                return word;
            }
        }
        
        // Final fallback: capitalize user input properly
        return capitalizeWineName(userInputWinery);
    }
    
    /**
     * Extract wine name from search result title using enhanced pattern matching
     */
    private String extractWineNameFromTitle(String title, String userInputWineName) {
        if (title == null || title.isEmpty() || userInputWineName == null) {
            return capitalizeWineName(userInputWineName);
        }
        
        log.debug("🔍 Extracting wine name from title: '{}' | User input: '{}'", title, userInputWineName);
        
        // Step 1: Try structured title patterns first
        String structuredMatch = extractFromStructuredTitle(title, userInputWineName);
        if (structuredMatch != null) {
            log.debug("✅ Found structured match: '{}'", structuredMatch);
            return structuredMatch;
        }
        
        // Step 2: Common wine type patterns
        String[] winePatterns = {
            "Cabernet Sauvignon", "Cabernet Franc", "Pinot Noir", "Pinot Grigio", "Pinot Gris",
            "Sauvignon Blanc", "Chardonnay", "Merlot", "Syrah", "Shiraz",
            "Riesling", "Gewürztraminer", "Petit Verdot", "Petite Verdot",
            "Petit Castel", "Grand Castel", "Blend", "Reserve", "Rosé", "Rose", "Brut", "Sec", 
            "Moscato", "Muscat", "Tempranillo", "Sangiovese", "Barbera", "Nebbiolo", 
            "Grenache", "Mourvedre", "Viognier", "Chenin Blanc", "Semillon", "Petit Sirah", "Zinfandel"
        };
        
        // Step 3: Handle multi-word wine names with fuzzy matching
        String[] userWords = userInputWineName.trim().split("\\s+");
        if (userWords.length > 1) {
            // For multi-word wine names, try to find the best matching pattern
            String bestMatch = findBestMatchInTitle(title, userInputWineName, winePatterns);
            if (bestMatch != null) {
                log.debug("✅ Found pattern match: '{}'", bestMatch);
                return bestMatch;
            }
            
            // Try to match individual words and reconstruct
            StringBuilder extractedName = new StringBuilder();
            for (String userWord : userWords) {
                String wordMatch = findBestMatchInTitle(title, userWord, winePatterns);
                if (wordMatch == null) {
                    // Try direct word matching
                    String[] titleWords = title.split("[\\\\s\\\\-,\\\\.]+");
                    for (String titleWord : titleWords) {
                        if (calculateLevenshteinDistance(userWord, titleWord) <= Math.max(1, userWord.length() / 3)) {
                            wordMatch = titleWord;
                            break;
                        }
                    }
                }
                
                if (wordMatch != null) {
                    if (extractedName.length() > 0) extractedName.append(" ");
                    extractedName.append(wordMatch);
                } else {
                    // Use capitalized user input for this word
                    if (extractedName.length() > 0) extractedName.append(" ");
                    extractedName.append(capitalizeWineName(userWord));
                }
            }
            
            String result = extractedName.toString();
            if (!result.trim().isEmpty()) {
                log.debug("✅ Reconstructed match: '{}'", result);
                return result;
            }
        } else {
            // Single word wine name
            String bestMatch = findBestMatchInTitle(title, userInputWineName, winePatterns);
            if (bestMatch != null) {
                log.debug("✅ Single word match: '{}'", bestMatch);
                return bestMatch;
            }
        }
        
        log.debug("❌ No match found, using fallback: '{}'", capitalizeWineName(userInputWineName));
        // Final fallback: capitalize user input properly
        return capitalizeWineName(userInputWineName);
    }
    
    /**
     * Extract wine name from structured title patterns commonly used by wine retailers
     */
    private String extractFromStructuredTitle(String title, String userInputWineName) {
        // Clean the title for better matching
        String cleanTitle = title.replaceAll("\\|.*$", "").trim(); // Remove everything after |
        cleanTitle = cleanTitle.replaceAll("\\s*-\\s*[^-]*\\.com.*$", "").trim(); // Remove shop names
        
        log.debug("🧹 Cleaned title: '{}'", cleanTitle);
        
        // Pattern 1: "Winery Wine Name Year" (e.g., "Castel Petit Castel 2023")
        Pattern pattern1 = Pattern.compile("(?i)(?:domaine\\s+du\\s+)?castel\\s+(petit\\s+castel|grand\\s+castel)(?:\\s+\\d{4})?", Pattern.CASE_INSENSITIVE);
        Matcher matcher1 = pattern1.matcher(cleanTitle);
        if (matcher1.find()) {
            String extracted = matcher1.group(1);
            return capitalizeWineName(extracted);
        }
        
        // Pattern 2: "Domaine Name : Wine Name Year" (e.g., "Domaine du Castel : Petit Castel 2023")
        Pattern pattern2 = Pattern.compile("(?i).*:\\s*(petit\\s+castel|grand\\s+castel)(?:\\s+\\d{4})?", Pattern.CASE_INSENSITIVE);
        Matcher matcher2 = pattern2.matcher(cleanTitle);
        if (matcher2.find()) {
            String extracted = matcher2.group(1);
            return capitalizeWineName(extracted);
        }
        
        // Pattern 3: Look for "Petit/Grand + Castel" anywhere in title
        Pattern pattern3 = Pattern.compile("(?i)(petit|grand)\\s+(castel)", Pattern.CASE_INSENSITIVE);
        Matcher matcher3 = pattern3.matcher(cleanTitle);
        if (matcher3.find()) {
            String extracted = matcher3.group(1) + " " + matcher3.group(2);
            return capitalizeWineName(extracted);
        }
        
        // Pattern 4: Generic wine name extraction for other wineries
        // Look for potential wine names after winery names
        String[] parts = cleanTitle.split("\\s+");
        for (int i = 0; i < parts.length - 1; i++) {
            String current = parts[i];
            String next = parts[i + 1];
            
            // If we find a winery-like word followed by a potential wine name
            if (isWineryWord(current) && isPotentialWineName(next)) {
                StringBuilder wineName = new StringBuilder();
                // Collect subsequent words that could be part of wine name
                for (int j = i + 1; j < parts.length && j < i + 4; j++) { // Max 3 words for wine name
                    if (isYear(parts[j])) break; // Stop at year
                    if (j > i + 1) wineName.append(" ");
                    wineName.append(parts[j]);
                }
                
                String result = wineName.toString().trim();
                if (!result.isEmpty() && containsIgnoreCase(result, userInputWineName)) {
                    return capitalizeWineName(result);
                }
            }
        }
        
        return null; // No structured pattern found
    }
    
    /**
     * Check if a word looks like a winery name
     */
    private boolean isWineryWord(String word) {
        if (word == null || word.length() < 3) return false;
        String lower = word.toLowerCase();
        return lower.matches(".*(?:castel|domaine|château|winery|estate|cellars?|vineyard).*") || 
               Character.isUpperCase(word.charAt(0));
    }
    
    /**
     * Check if a word could be part of a wine name
     */
    private boolean isPotentialWineName(String word) {
        if (word == null || word.length() < 2) return false;
        String lower = word.toLowerCase();
        return !isYear(word) && 
               !lower.matches(".*(?:\\.com|www\\.|http|cases|ship|free|bottle|ml|cl|%).*") &&
               Character.isAlphabetic(word.charAt(0));
    }
    
    /**
     * Check if a string represents a year
     */
    private boolean isYear(String str) {
        if (str == null || str.length() != 4) return false;
        try {
            int year = Integer.parseInt(str);
            return year >= 1900 && year <= 2030;
        } catch (NumberFormatException e) {
            return false;
        }
    }
    
    /**
     * Capitalize wine/winery names properly
     */
    private String capitalizeWineName(String name) {
        if (name == null || name.isEmpty()) {
            return name;
        }
        
        String[] words = name.trim().split("\\s+");
        StringBuilder capitalized = new StringBuilder();
        
        for (String word : words) {
            if (capitalized.length() > 0) {
                capitalized.append(" ");
            }
            
            if (word.length() > 0) {
                capitalized.append(word.substring(0, 1).toUpperCase())
                          .append(word.substring(1).toLowerCase());
            }
        }
        
        return capitalized.toString();
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
