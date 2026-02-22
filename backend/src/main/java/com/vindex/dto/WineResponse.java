package com.vindex.dto;

public class WineResponse {
    private Long id;
    private String name;
    private String type;
    private String vintage;
    private Integer quantity;
    private String winery;
    private String region;
    private String country;
    private String imageUrl;
    private String location;
    private Integer rowId;

    public WineResponse(Long id, String name, String type, String vintage, Integer quantity,
                        String winery, String region, String country, String imageUrl, 
                        String location, Integer rowId) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.vintage = vintage;
        this.quantity = quantity;
        this.winery = winery;
        this.region = region;
        this.country = country;
        this.imageUrl = imageUrl;
        this.location = location;
        this.rowId = rowId;
    }

    public Long getId() {
        return id;
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

    public Integer getQuantity() {
        return quantity;
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

    public String getLocation() {
        return location;
    }

    public Integer getRowId() {
        return rowId;
    }
}
