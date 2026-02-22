package com.vindex.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vindex.dto.WineSuggestionDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class WineSuggestionService {

    private static final String PLACEHOLDER_IMAGE = "/wine-placeholder.svg";
    private final List<WineSuggestionDto> catalog = new ArrayList<>();
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${snooth.api.base-url:https://api.snooth.com/wines/}")
    private String apiBaseUrl;

    @Value("${snooth.api.key:}")
    private String apiKey;

    public WineSuggestionService() {
        // Israeli wines (curated sample list for autocomplete)
        catalog.add(new WineSuggestionDto("Yarden Cabernet Sauvignon", "RED", "2018", "Golan Heights Winery", "Golan Heights", "Israel", PLACEHOLDER_IMAGE));
        catalog.add(new WineSuggestionDto("Yarden Chardonnay", "WHITE", "2020", "Golan Heights Winery", "Galilee", "Israel", PLACEHOLDER_IMAGE));
        catalog.add(new WineSuggestionDto("Barkan Reserve Cabernet Sauvignon", "RED", "2019", "Barkan Winery", "Judean Hills", "Israel", PLACEHOLDER_IMAGE));
        catalog.add(new WineSuggestionDto("Carmel Special Edition", "RED", "2017", "Carmel Winery", "Galilee", "Israel", PLACEHOLDER_IMAGE));
        catalog.add(new WineSuggestionDto("Tabor Adama", "RED", "2018", "Tabor Winery", "Galilee", "Israel", PLACEHOLDER_IMAGE));
        catalog.add(new WineSuggestionDto("Recanati Marawi", "WHITE", "2021", "Recanati", "Judean Hills", "Israel", PLACEHOLDER_IMAGE));
        catalog.add(new WineSuggestionDto("Domaine du Castel Grand Vin", "RED", "2016", "Domaine du Castel", "Judean Hills", "Israel", PLACEHOLDER_IMAGE));
        catalog.add(new WineSuggestionDto("Flam Classico", "RED", "2019", "Flam Winery", "Judean Hills", "Israel", PLACEHOLDER_IMAGE));
        catalog.add(new WineSuggestionDto("Tulip Reserve", "RED", "2018", "Tulip Winery", "Upper Galilee", "Israel", PLACEHOLDER_IMAGE));
        catalog.add(new WineSuggestionDto("Teperberg Essence", "RED", "2019", "Teperberg", "Judean Hills", "Israel", PLACEHOLDER_IMAGE));

        // A few global staples for broader results
        catalog.add(new WineSuggestionDto("Barolo", "RED", "2016", "Giovanni Rosso", "Piedmont", "Italy", PLACEHOLDER_IMAGE));
        catalog.add(new WineSuggestionDto("Bordeaux Blend", "RED", "2018", "Chateau La Tour", "Bordeaux", "France", PLACEHOLDER_IMAGE));
        catalog.add(new WineSuggestionDto("Napa Valley Cabernet", "RED", "2019", "Silver Oak", "Napa Valley", "USA", PLACEHOLDER_IMAGE));
        catalog.add(new WineSuggestionDto("Prosecco Extra Dry", "SPARKLING", "2021", "La Marca", "Veneto", "Italy", PLACEHOLDER_IMAGE));
    }

    public List<WineSuggestionDto> search(String query) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }

        if (apiKey != null && !apiKey.isBlank()) {
            List<WineSuggestionDto> apiResults = fetchFromApi(query.trim());
            if (!apiResults.isEmpty()) {
                return apiResults;
            }
        }

        String normalized = query.trim().toLowerCase(Locale.ROOT);

        return catalog.stream()
            .filter(item -> item.getName().toLowerCase(Locale.ROOT).contains(normalized))
                .sorted(Comparator.comparing(WineSuggestionDto::getName))
                .limit(8)
                .collect(Collectors.toList());
    }

    private List<WineSuggestionDto> fetchFromApi(String query) {
        try {
            String url = UriComponentsBuilder.fromHttpUrl(apiBaseUrl)
                    .queryParam("akey", apiKey)
                    .queryParam("q", query)
                    .queryParam("n", 12)
                    .build()
                    .toUriString();

            String response = restTemplate.getForObject(url, String.class);
            if (response == null || response.isBlank()) {
                return List.of();
            }

            JsonNode root = objectMapper.readTree(response);
            JsonNode wines = root.path("wines");
            if (!wines.isArray()) {
                return List.of();
            }

            List<WineSuggestionDto> results = new ArrayList<>();
            for (JsonNode wine : wines) {
                String name = wine.path("name").asText("").trim();
                if (name.isEmpty()) {
                    continue;
                }

                String type = normalizeType(wine.path("type").asText("")
                        .trim());
                String vintage = wine.path("vintage").asText("").trim();
                String winery = wine.path("winery").asText("").trim();
                String region = wine.path("region").asText("").trim();
                String country = wine.path("country").asText("").trim();
                String imageUrl = wine.path("image").asText("").trim();
                if (imageUrl.isEmpty()) {
                    imageUrl = PLACEHOLDER_IMAGE;
                }

                results.add(new WineSuggestionDto(name, type, vintage, winery, region, country, imageUrl));
            }

                String normalized = query.toLowerCase(Locale.ROOT);
                return results.stream()
                    .filter(item -> item.getName().toLowerCase(Locale.ROOT).contains(normalized))
                    .sorted(Comparator.comparing(WineSuggestionDto::getName))
                    .limit(8)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            return List.of();
        }
    }

    private String normalizeType(String value) {
        String normalized = value.toLowerCase(Locale.ROOT);
        if (normalized.contains("spark")) {
            return "SPARKLING";
        }
        if (normalized.contains("rose") || normalized.contains("ros")) {
            return "ROSE";
        }
        if (normalized.contains("dessert") || normalized.contains("sweet")) {
            return "DESSERT";
        }
        if (normalized.contains("fortified")) {
            return "FORTIFIED";
        }
        if (normalized.contains("white")) {
            return "WHITE";
        }
        if (normalized.contains("red")) {
            return "RED";
        }
        return "";
    }
}
