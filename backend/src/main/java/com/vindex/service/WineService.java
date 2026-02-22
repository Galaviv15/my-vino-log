package com.vindex.service;

import com.vindex.dto.WineRequest;
import com.vindex.dto.WineResponse;
import com.vindex.entity.User;
import com.vindex.entity.Wine;
import com.vindex.repository.UserRepository;
import com.vindex.repository.WineRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
public class WineService {

    private static final String DEFAULT_IMAGE = "/wine-placeholder.svg";

    private final WineRepository wineRepository;
    private final UserRepository userRepository;

    public WineService(WineRepository wineRepository, UserRepository userRepository) {
        this.wineRepository = wineRepository;
        this.userRepository = userRepository;
    }

    public List<WineResponse> listWines() {
        User user = getCurrentUser();
        return wineRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public WineResponse createWine(WineRequest request) {
        User user = getCurrentUser();
        Wine wine = new Wine();
        wine.setUser(user);
        applyRequest(wine, request);
        Wine saved = wineRepository.save(wine);
        return toResponse(saved);
    }

    public WineResponse updateWine(Long id, WineRequest request) {
        User user = getCurrentUser();
        Wine wine = wineRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Wine not found"));
        applyRequest(wine, request);
        wine.setUpdatedAt(LocalDateTime.now());
        Wine saved = wineRepository.save(wine);
        return toResponse(saved);
    }

    public void deleteWine(Long id) {
        User user = getCurrentUser();
        Wine wine = wineRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Wine not found"));
        wineRepository.delete(wine);
    }

    private void applyRequest(Wine wine, WineRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Wine name is required");
        }

        wine.setWineName(request.getName().trim());
        wine.setWineType(toWineType(request.getType()));
        wine.setVintageYear(parseVintage(request.getVintage()));
        wine.setQuantity(normalizeQuantity(request.getQuantity()));
        wine.setWinery(trimToNull(request.getWinery()));
        wine.setRegion(trimToNull(request.getRegion()));
        wine.setCountry(trimToNull(request.getCountry()));

        String imageUrl = trimToNull(request.getImageUrl());
        wine.setImageUrl(imageUrl == null ? DEFAULT_IMAGE : imageUrl);
    }

    private Integer parseVintage(String vintage) {
        if (vintage == null || vintage.trim().isEmpty()) {
            return null;
        }
        try {
            return Integer.valueOf(vintage.trim());
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private Integer normalizeQuantity(Integer quantity) {
        if (quantity == null || quantity < 1) {
            return 1;
        }
        return quantity;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private Wine.WineType toWineType(String type) {
        if (type == null || type.trim().isEmpty()) {
            return null;
        }
        String normalized = type.trim().toUpperCase(Locale.ROOT);
        if ("ROSE".equals(normalized) || Wine.WineType.ROSÉ.name().equals(normalized)) {
            return Wine.WineType.ROSÉ;
        }
        try {
            return Wine.WineType.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }

    private String fromWineType(Wine.WineType type) {
        if (type == null) {
            return null;
        }
        if (type == Wine.WineType.ROSÉ) {
            return "ROSE";
        }
        return type.name();
    }

    private WineResponse toResponse(Wine wine) {
        String vintage = wine.getVintageYear() == null ? null : wine.getVintageYear().toString();
        return new WineResponse(
                wine.getId(),
                wine.getWineName(),
                fromWineType(wine.getWineType()),
                vintage,
                wine.getQuantity(),
                wine.getWinery(),
                wine.getRegion(),
                wine.getCountry(),
                wine.getImageUrl()
        );
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }
}
