import apiClient from './api';

export interface WineDiscoveryRequest {
  winery: string;
  wineName: string;
  vintage?: string;
}

export interface DiscoveredWine {
  id?: number;
  winery: string;
  wineName: string;
  vintage: string;
  type?: string;
  grapes?: string[];
  region?: string;
  country?: string;
  alcoholContent?: number;
  source?: string;
  aiValidated?: boolean;
}

/**
 * Call the wine discovery API to find wine details
 */
export const discoverWine = async (request: WineDiscoveryRequest): Promise<DiscoveredWine | null> => {
  try {
    const response = await apiClient.post<DiscoveredWine>('/wine-discovery/discover', request);
    return response.data;
  } catch (error: any) {
    console.error('Error discovering wine:', error);
    return null;
  }
};

/**
 * Search wines by winery name in the global database
 */
export const searchWinesByWinery = async (winery: string): Promise<DiscoveredWine[]> => {
  try {
    const response = await apiClient.get<DiscoveredWine[]>(`/wine-discovery/search/winery?name=${encodeURIComponent(winery)}`);
    return response.data || [];
  } catch (error: any) {
    console.error('Error searching wines by winery:', error);
    return [];
  }
};

/**
 * Search wines by name in the global database
 */
export const searchWinesByName = async (name: string): Promise<DiscoveredWine[]> => {
  try {
    const response = await apiClient.get<DiscoveredWine[]>(`/wine-discovery/search/name?query=${encodeURIComponent(name)}`);
    return response.data || [];
  } catch (error: any) {
    console.error('Error searching wines by name:', error);
    return [];
  }
};

/**
 * Get all validated wines from the global database
 */
export const getValidatedWines = async (): Promise<DiscoveredWine[]> => {
  try {
    const response = await apiClient.get<DiscoveredWine[]>('/wine-discovery/validated');
    return response.data || [];
  } catch (error: any) {
    console.error('Error fetching validated wines:', error);
    return [];
  }
};
