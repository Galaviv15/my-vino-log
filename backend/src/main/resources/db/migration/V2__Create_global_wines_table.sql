CREATE TABLE global_wines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    winery VARCHAR(255) NOT NULL,
    wine_name VARCHAR(255) NOT NULL,
    vintage VARCHAR(10),
    grapes JSON,
    region VARCHAR(255),
    country VARCHAR(100),
    alcohol_content DECIMAL(5,2),
    source VARCHAR(50) DEFAULT 'AI',
    ai_validated BOOLEAN DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_wine_lookup (winery, wine_name, vintage),
    INDEX idx_winery (winery),
    INDEX idx_wine_name (wine_name),
    INDEX idx_country (country),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
