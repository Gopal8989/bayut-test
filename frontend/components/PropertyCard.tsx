import React from 'react';
import Link from 'next/link';
import { Property } from '../lib/types';
import { getImageUrl, getPlaceholderImage } from '../lib/imageUtils';

interface PropertyCardProps {
  property: Property;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Get property ID - handle both id and _id (MongoDB)
  const propertyId = property.id || property._id;
  
  // Validate property ID before creating link
  if (!propertyId) {
    console.warn('Property missing ID:', property);
    return null;
  }

  return (
    <Link href={`/properties/${propertyId}`} passHref>
      <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden hover:shadow-medium transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group">
        {/* Image Section */}
        <div className="relative w-full h-64 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
          {property.images && property.images.length > 0 ? (
            <img
              src={getImageUrl(property.images[0])}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              loading="lazy"
              onError={(e) => {
                // Fallback to placeholder image if original fails
                const target = e.target as HTMLImageElement;
                target.src = getPlaceholderImage(400, 300);
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-light to-primary-lighter">
              <img
                src={getPlaceholderImage(400, 300)}
                alt="Demo property"
                className="w-full h-full object-cover opacity-50"
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center bg-white bg-opacity-80 px-4 py-2 rounded-lg">
                  <div className="text-2xl mb-1">🏠</div>
                  <span className="text-gray-600 text-xs font-medium">Demo Image</span>
                </div>
              </div>
            </div>
          )}
          {/* Badge */}
          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-md ${
              property.purpose === 'sale' 
                ? 'bg-success text-white' 
                : 'bg-accent text-white'
            }`}>
              {property.purpose === 'sale' ? 'SALE' : 'RENT'}
            </span>
          </div>
          {/* Image Count Badge */}
          {property.images && property.images.length > 1 && (
            <div className="absolute top-4 right-4 bg-black bg-opacity-70 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1">
              <span>📷</span>
              {property.images.length}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-6">
          {/* Price */}
          <div className="mb-3">
            <div className="text-2xl font-bold text-primary mb-1">
              {formatPrice(property.price)}
            </div>
            {property.purpose === 'rent' && (
              <span className="text-sm text-gray-500">per year</span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {property.title}
          </h3>

          {/* Location */}
          <div className="flex items-center text-gray-600 text-sm mb-4">
            <span className="mr-1">📍</span>
            <span>{property.location}, {property.city}</span>
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100">
            {property.bedrooms && (
              <div className="flex items-center gap-1 text-gray-700">
                <span className="text-lg">🛏️</span>
                <span className="font-medium">{property.bedrooms}</span>
                <span className="text-sm text-gray-500">Beds</span>
              </div>
            )}
            {property.bathrooms && (
              <div className="flex items-center gap-1 text-gray-700">
                <span className="text-lg">🚿</span>
                <span className="font-medium">{property.bathrooms}</span>
                <span className="text-sm text-gray-500">Baths</span>
              </div>
            )}
            {property.areaSize && (
              <div className="flex items-center gap-1 text-gray-700">
                <span className="text-lg">📐</span>
                <span className="font-medium">{property.areaSize}</span>
                <span className="text-sm text-gray-500">sqft</span>
              </div>
            )}
            {property.parking !== null && property.parking !== undefined && (
              <div className="flex items-center gap-1 text-gray-700">
                <span className="text-lg">🚗</span>
                <span className="font-medium">{property.parking}</span>
                <span className="text-sm text-gray-500">Parking</span>
              </div>
            )}
          </div>

          {/* Type Badge */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <span className="inline-block px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold capitalize">
              {property.type}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;

