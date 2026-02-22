package com.vindex.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_preferences")
@Data
@NoArgsConstructor
public class UserPreference {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "wine_type")
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private WineType wineType;

    @Column(name = "favorite_winery")
    private String favoriteWinery;

    @Column(name = "grape_variety")
    private String grapeVariety;

    @Column(name = "is_kosher_preferred")
    private Boolean isKosherPreferred = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum WineType {
        RED, WHITE, SPARKLING, ROSÉ, DESSERT, FORTIFIED
    }
}
