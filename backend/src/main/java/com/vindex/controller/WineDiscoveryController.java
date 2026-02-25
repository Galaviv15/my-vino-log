package com.vindex.controller;

import com.vindex.dto.WineDiscoveryRequest;
import com.vindex.dto.WineDiscoveryResponse;
import com.vindex.entity.GlobalWine;
import com.vindex.service.WineDiscoveryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import java.util.List;

@RestController
@RequestMapping("/wine-discovery")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:5173}")
public class WineDiscoveryController {

    private final WineDiscoveryService wineDiscoveryService;

    /**
     * Discover wine details using AI
     * POST /api/wine-discovery/discover
     */
    @PostMapping("/discover")
    public ResponseEntity<?> discoverWine(@RequestBody WineDiscoveryRequest request) {
        log.info("Wine discovery request: {} {} {}", request.getWinery(), request.getWineName(), request.getVintage());

        try {
            GlobalWine wine = wineDiscoveryService.discoverWine(
                    request.getWinery(),
                    request.getWineName(),
                    request.getVintage()
            );

            if (wine == null) {
                return ResponseEntity.badRequest().body(
                        Map.of("error", "Could not discover wine details. Please manually enter the wine information.")
                );
            }

            WineDiscoveryResponse response = mapToResponse(wine);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error discovering wine", e);
            return ResponseEntity.internalServerError().body(
                    Map.of("error", "An error occurred during wine discovery: " + e.getMessage())
            );
        }
    }

    /**
     * Get wine by ID
     * GET /api/wine-discovery/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getWineById(@PathVariable Long id) {
        GlobalWine wine = wineDiscoveryService.getWineById(id);
        if (wine == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(mapToResponse(wine));
    }

    /**
     * Search wines by winery name
     * GET /api/wine-discovery/search/winery?name=...
     */
    @GetMapping("/search/winery")
    public ResponseEntity<List<WineDiscoveryResponse>> searchByWinery(@RequestParam String name) {
        List<GlobalWine> wines = wineDiscoveryService.searchByWinery(name);
        List<WineDiscoveryResponse> responses = wines.stream()
                .map(this::mapToResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    /**
     * Search wines by name
     * GET /api/wine-discovery/search/name?query=...
     */
    @GetMapping("/search/name")
    public ResponseEntity<List<WineDiscoveryResponse>> searchByName(@RequestParam String query) {
        List<GlobalWine> wines = wineDiscoveryService.searchByName(query);
        List<WineDiscoveryResponse> responses = wines.stream()
                .map(this::mapToResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    /**
     * Get all validated wines
     * GET /api/wine-discovery/validated
     */
    @GetMapping("/validated")
    public ResponseEntity<List<WineDiscoveryResponse>> getValidatedWines() {
        List<GlobalWine> wines = wineDiscoveryService.getAllValidatedWines();
        List<WineDiscoveryResponse> responses = wines.stream()
                .map(this::mapToResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    /**
     * Map GlobalWine to response DTO
     */
    private WineDiscoveryResponse mapToResponse(GlobalWine wine) {
        return WineDiscoveryResponse.builder()
                .id(wine.getId())
                .winery(wine.getWinery())
                .wineName(wine.getWineName())
                .vintage(wine.getVintage())
                .type(wine.getType())
                .grapes(wine.getGrapes())
                .region(wine.getRegion())
                .country(wine.getCountry())
                .alcoholContent(wine.getAlcoholContent())
                .imageUrl(wine.getImageUrl())
                .source(wine.getSource())
                .aiValidated(wine.getAiValidated())
                .createdAt(wine.getCreatedAt())
                .build();
    }
}
