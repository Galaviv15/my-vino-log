import apiClient from './api';

/**
 * Upload wine image
 */
export const uploadWineImage = async (wineId: number, file: File): Promise<{ imageUrl: string } | null> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<{ imageUrl: string }>(
      `/wine-images/upload/${wineId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Error uploading wine image:', error);
    return null;
  }
};

/**
 * Delete wine image
 */
export const deleteWineImage = async (wineId: number): Promise<boolean> => {
  try {
    await apiClient.delete(`/wine-images/${wineId}`);
    return true;
  } catch (error: any) {
    console.error('Error deleting wine image:', error);
    return false;
  }
};

/**
 * Get image URL from relative path
 */
export const getImageUrl = (imageUrl?: string): string => {
  if (!imageUrl) {
    return '/wine-placeholder.svg';
  }

  // If it's already an absolute URL, return as is
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }

  // If it's a relative path from API, prepend the base URL
  if (imageUrl.startsWith('/')) {
    return `http://localhost:8080${imageUrl}`;
  }

  // Otherwise assume it's a relative path
  return `http://localhost:8080/api${imageUrl}`;
};

/**
 * Validate file for image upload
 */
export const validateImageFile = (file: File): string | null => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!validTypes.includes(file.type)) {
    return 'Invalid file type. Please upload JPG, PNG, GIF, or WebP images.';
  }

  if (file.size > maxSize) {
    return 'File size exceeds 5MB limit.';
  }

  return null;
};
