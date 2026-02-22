package com.vindex.controller;

import com.vindex.dto.WineSuggestionDto;
import com.vindex.service.WineSuggestionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/wines")
public class WineSuggestionController {

    private final WineSuggestionService wineSuggestionService;

    public WineSuggestionController(WineSuggestionService wineSuggestionService) {
        this.wineSuggestionService = wineSuggestionService;
    }

    @GetMapping("/search")
    public List<WineSuggestionDto> search(@RequestParam("query") String query) {
        return wineSuggestionService.search(query);
    }
}
