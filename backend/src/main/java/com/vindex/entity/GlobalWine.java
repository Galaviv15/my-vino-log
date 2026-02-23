package com.vindex.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "global_wines")
@Data
@NoArgsConstructor
public class GlobalWine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "winery", nullable = false)
    private String winery;

    @Column(name = "wine_name", nullable = false)
    private String wineName;

    @Column(name = "vintage")
    private String vintage; // Can be a year or "NV" for Non-Vintage

    @Column(name = "grapes", columnDefinition = "JSON")
    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> grapes;

    @Column(name = "region")
    private String region;

    @Column(name = "country")
    private String country;

    @Column(name = "alcohol_content")
    @JdbcTypeCode(SqlTypes.DECIMAL)
    @Min(value = 5, message = "Alcohol content must be at least 5%")
    @Max(value = 22, message = "Alcohol content cannot exceed 22%")
    private Double alcoholContent;

    @Column(name = "source")
    private String source = "AI"; // Can be "AI", "MANUAL", "IMPORT", etc.

    @Column(name = "ai_validated")
    private Boolean aiValidated = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
