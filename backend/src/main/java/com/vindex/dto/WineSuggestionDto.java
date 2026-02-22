package com.vindex.dto;

public class WineSuggestionDto {
    private String name;
    private String type;
    private String vintage;
    private String winery;
    private String region;
    private String country;
    private String imageUrl;

    public WineSuggestionDto(String name, String type, String vintage, String winery,
                             String region, String country, String imageUrl) {
        this.name = name;
        this.type = type;
        this.vintage = vintage;
        this.winery = winery;
        this.region = region;
        this.country = country;
        this.imageUrl = imageUrl;
    }

    public String getName() {
        return name;
    }

    public String getType() {
        return type;
    }

    public String getVintage() {
        return vintage;
    }

    public String getWinery() {
        return winery;
    }

    public String getRegion() {
        return region;
    }

    public String getCountry() {
        return country;
    }

    public String getImageUrl() {
        return imageUrl;
    }
}
