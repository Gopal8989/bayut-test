import React, { useState, useRef, useEffect } from 'react';
import { getImageUrl, getPlaceholderImage, getImageUrls } from '../lib/imageUtils';

interface ImageGalleryProps {
  images: string[] | undefined | null;
  title: string;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images: rawImages, title }) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Process images with base URL
  // Handle both array and single image string
  const imageArray = Array.isArray(rawImages) 
    ? rawImages 
    : rawImages 
      ? [rawImages] 
      : [];

  const processedImages = imageArray.length > 0 
    ? getImageUrls(imageArray)
    : [];

  // Use default placeholder if no images
  const displayImages = processedImages.length > 0 
    ? processedImages 
    : [getPlaceholderImage(800, 600)];

  const hasRealImages = processedImages.length > 0;

  const handleImageError = (index: number) => {
    setImageErrors(prev => new Set(prev).add(index));
  };

  const getImageSrc = (index: number) => {
    if (imageErrors.has(index)) {
      return getPlaceholderImage(800, 600);
    }
    return displayImages[index];
  };

  const scrollThumbnail = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 200;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <>
      <div className="relative">
        {/* Main Image */}
        <div className="relative h-96 bg-gray-100 rounded-xl overflow-hidden group cursor-pointer" onClick={() => setIsFullscreen(true)}>
          {hasRealImages ? (
            <img
              src={getImageSrc(selectedImage)}
              alt={`${title} - Image ${selectedImage + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => handleImageError(selectedImage)}
              onLoad={() => console.log('Image loaded successfully:', getImageSrc(selectedImage))}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
              <img
                src={getPlaceholderImage(800, 600)}
                alt="Default property image"
                className="w-full h-full object-cover opacity-50"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center bg-white bg-opacity-90 px-6 py-4 rounded-lg">
                  <div className="text-6xl mb-4">🏠</div>
                  <span className="text-gray-500 font-medium block">No Images Available</span>
                  <span className="text-gray-400 text-sm mt-2 block">Default image shown</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Navigation Arrows */}
          {hasRealImages && displayImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(Math.max(0, selectedImage - 1));
                }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 p-3 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 z-10"
                disabled={selectedImage === 0}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(Math.min(displayImages.length - 1, selectedImage + 1));
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 p-3 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 z-10"
                disabled={selectedImage === displayImages.length - 1}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Image Counter */}
          {hasRealImages && displayImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-sm font-medium z-10">
              {selectedImage + 1} / {displayImages.length}
            </div>
          )}


          {/* Fullscreen Indicator */}
          <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </div>
        </div>

        {/* Thumbnail Scroller - Only show if we have real images */}
        {hasRealImages && displayImages.length > 0 && (
          <div className="relative mt-4">
            {/* Scroll Left Button */}
            {displayImages.length > 4 && (
              <button
                onClick={() => scrollThumbnail('left')}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Scrollable Thumbnail Container */}
            <div
              ref={scrollContainerRef}
              className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 px-8"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {Array.isArray(displayImages) && displayImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative flex-shrink-0 h-20 w-20 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === index
                      ? 'border-primary shadow-md scale-105'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img
                    src={getImageSrc(index)}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(index)}
                  />
                  {selectedImage === index && (
                    <div className="absolute inset-0 bg-primary bg-opacity-20 border-2 border-primary rounded-lg"></div>
                  )}
                  {/* Error Indicator */}
                  {imageErrors.has(index) && (
                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-xs">⚠️</span>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Scroll Right Button */}
            {displayImages.length > 4 && (
              <button
                onClick={() => scrollThumbnail('right')}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"
          onClick={() => setIsFullscreen(false)}
        >
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={getImageSrc(selectedImage)}
            alt={`${title} - Image ${selectedImage + 1}`}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
            onError={() => handleImageError(selectedImage)}
          />
        </div>
      )}
    </>
  );
};

export default ImageGallery;

