package com.vindex.repository;

import com.vindex.entity.GlobalWine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GlobalWineRepository extends JpaRepository<GlobalWine, Long> {
    
    /**
     * Find a wine by winery, name, and vintage (unique lookup)
     */
    Optional<GlobalWine> findByWineryAndWineNameAndVintage(String winery, String wineName, String vintage);
    
    /**
     * Find all wines by winery name (case-insensitive)
     */
    List<GlobalWine> findByWineryIgnoreCase(String winery);
    
    /**
     * Find all wines by country
     */
    List<GlobalWine> findByCountry(String country);
    
    /**
     * Find all wines by region
     */
    List<GlobalWine> findByRegion(String region);
    
    /**
     * Search wines by name (case-insensitive, partial match)
     */
    List<GlobalWine> findByWineNameIgnoreCaseContaining(String wineName);
    
    /**
     * Find all AI-validated wines
     */
    List<GlobalWine> findByAiValidatedTrue();
    
    /**
     * Find wines by source (AI, MANUAL, IMPORT, etc.)
     */
    List<GlobalWine> findBySource(String source);
}
