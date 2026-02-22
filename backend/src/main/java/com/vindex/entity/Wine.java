package com.vindex.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "wines")
@Data
@NoArgsConstructor
public class Wine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotBlank
    @Column(name = "wine_name")
    private String wineName;

    @Column(name = "wine_type")
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private WineType wineType;

    @Column(name = "vintage_year")
    private Integer vintageYear;

    @Column(name = "winery")
    private String winery;

    @Column(name = "grape_variety")
    private String grapeVariety;

    @Column(name = "region")
    private String region;

    @Column(name = "country")
    private String country;

    @Column(name = "alcohol_percentage")
    @JdbcTypeCode(SqlTypes.DECIMAL)
    private Double alcoholPercentage;

    @Column(name = "is_kosher")
    private Boolean isKosher = false;

    @Column(name = "optimal_drink_by")
    private LocalDate optimalDrinkBy;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "quantity")
    private Integer quantity = 1;

    @Column(name = "price")
    @JdbcTypeCode(SqlTypes.DECIMAL)
    private Double price;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "location")
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private WineLocation location = WineLocation.CELLAR;

    @Column(name = "row_id")
    private Integer rowId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum WineType {
        RED, WHITE, SPARKLING, ROSÉ, DESSERT, FORTIFIED
    }

    public enum WineLocation {
        CELLAR, FRIDGE
    }
}
