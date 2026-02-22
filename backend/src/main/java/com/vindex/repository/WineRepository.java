package com.vindex.repository;

import com.vindex.entity.Wine;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WineRepository extends JpaRepository<Wine, Long> {
    List<Wine> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Wine> findByIdAndUserId(Long id, Long userId);
}
