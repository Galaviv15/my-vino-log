package com.vindex.controller;

import com.vindex.entity.GlobalWine;
import com.vindex.repository.GlobalWineRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@RestController
@RequestMapping("/api/wine-images")
@Slf4j
@RequiredArgsConstructor
public class WineImageController {

    private final GlobalWineRepository globalWineRepository;

    @Value("${wine.images.upload-dir:uploads/wine-images}")
    private String uploadDir;

    @Value("${wine.images.max-size:5242880}") // 5MB default
    private long maxFileSize;

    /**
     * Upload wine image
     */
    @PostMapping("/upload/{wineId}")
    public ResponseEntity<?> uploadWineImage(
            @PathVariable Long wineId,
            @RequestParam("file") MultipartFile file) {

        try {
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("File is empty");
            }

            if (file.getSize() > maxFileSize) {
                return ResponseEntity.badRequest()
                        .body("File size exceeds maximum allowed: " + maxFileSize + " bytes");
            }

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return ResponseEntity.badRequest().body("File must be an image");
            }

            // Find wine
            GlobalWine wine = globalWineRepository.findById(wineId)
                    .orElseThrow(() -> new RuntimeException("Wine not found"));

            // Create upload directory if it doesn't exist
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".jpg";
            String filename = UUID.randomUUID() + extension;

            // Save file
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Update wine with new image URL
            String imageUrl = "/api/wine-images/" + filename;
            wine.setImageUrl(imageUrl);
            globalWineRepository.save(wine);

            log.info("Wine image uploaded successfully: {}", filename);
            return ResponseEntity.ok().body(Map.of("imageUrl", imageUrl));

        } catch (IOException e) {
            log.error("Error uploading wine image", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload image: " + e.getMessage());
        }
    }

    /**
     * Get wine image
     */
    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> getWineImage(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION,
                                "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error retrieving wine image: {}", filename, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Delete wine image
     */
    @DeleteMapping("/{wineId}")
    public ResponseEntity<?> deleteWineImage(@PathVariable Long wineId) {
        try {
            GlobalWine wine = globalWineRepository.findById(wineId)
                    .orElseThrow(() -> new RuntimeException("Wine not found"));

            String imageUrl = wine.getImageUrl();
            if (imageUrl != null && imageUrl.startsWith("/api/wine-images/")) {
                // Extract filename from URL
                String filename = imageUrl.substring("/api/wine-images/".length());
                Path filePath = Paths.get(uploadDir).resolve(filename).normalize();

                // Delete file if it exists
                if (Files.exists(filePath)) {
                    Files.delete(filePath);
                    log.info("Deleted wine image file: {}", filename);
                }
            }

            // Remove image URL from wine
            wine.setImageUrl(null);
            globalWineRepository.save(wine);

            return ResponseEntity.ok().body(Map.of("message", "Image deleted successfully"));

        } catch (Exception e) {
            log.error("Error deleting wine image", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to delete image: " + e.getMessage());
        }
    }

    // Helper class for Map response
    private static class Map {
        public static java.util.Map<String, String> of(String key, String value) {
            java.util.Map<String, String> map = new java.util.HashMap<>();
            map.put(key, value);
            return map;
        }
    }
}
