package com.vindex.controller;

import com.vindex.dto.WineRequest;
import com.vindex.dto.WineResponse;
import com.vindex.service.WineService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/wines")
public class WineController {

    private final WineService wineService;

    public WineController(WineService wineService) {
        this.wineService = wineService;
    }

    @GetMapping
    public List<WineResponse> listWines() {
        return wineService.listWines();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public WineResponse createWine(@Valid @RequestBody WineRequest request) {
        return wineService.createWine(request);
    }

    @PutMapping("/{id}")
    public WineResponse updateWine(@PathVariable Long id, @Valid @RequestBody WineRequest request) {
        return wineService.updateWine(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteWine(@PathVariable Long id) {
        wineService.deleteWine(id);
    }
}
