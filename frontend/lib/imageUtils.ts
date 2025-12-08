/**
 * Get the full image URL with base URL attached
 * @param imagePath - The image path from the backend (e.g., "/uploads/image.png")
 * @returns Full URL with base URL
 */
export const getImageUrl = (imagePath: string | undefined | null): string => {
  if (!imagePath) {
    // Return a placeholder image if no image path provided
    return 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop';
  }

  // If already a full URL (starts with http:// or https://), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Get base URL from environment or use default
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  
  // Ensure imagePath starts with /
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  return `${baseUrl}${normalizedPath}`;
};

/**
 * Get multiple image URLs
 * @param images - Array of image paths
 * @returns Array of full URLs
 */
export const getImageUrls = (images: string[] | undefined | null): string[] => {
  if (!images || !Array.isArray(images) || images.length === 0) {
    return [];
  }
  
  return images.map(img => getImageUrl(img));
};

/**
 * Get a placeholder image URL
 * @param width - Image width (default: 800)
 * @param height - Image height (default: 600)
 * @returns Placeholder image URL
 */
export const getPlaceholderImage = (width: number = 800, height: number = 600): string => {
  return `https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=${width}&h=${height}&fit=crop`;
};

