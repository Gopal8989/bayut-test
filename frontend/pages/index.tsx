import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api, { getErrorMessage } from '../lib/api';
import { Property, FilterParams, PropertyPurpose, PropertyType } from '../lib/types';
import { useToast } from '../components/ToastContainer';
import LoadingSpinner from '../components/LoadingSpinner';
import PropertyCard from '../components/PropertyCard';
import UserMenu from '../components/UserMenu';

export default function Home() {
  const router = useRouter();
  const { showToast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterParams>({ page: 1, limit: 12 });
  const [cities, setCities] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [showBayutGPTPopup, setShowBayutGPTPopup] = useState(false);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
  });

  useEffect(() => {
    fetchCities();
    fetchLocations();
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [filters]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
      // Ensure pagination params
      if (!params.has('page')) params.append('page', '1');
      if (!params.has('limit')) params.append('limit', '12');
      
      const queryString = params.toString();
      const url = `/properties?${queryString}`;
      const response = await api.get(url);
      
      // Handle paginated response
      if (response.data && response.data.data) {
        setProperties(response.data.data || []);
        setPagination({
          total: response.data.total || 0,
          page: response.data.page || 1,
          limit: response.data.limit || 12,
          totalPages: response.data.totalPages || 0,
        });
      } else {
        // Fallback for non-paginated response
        setProperties(response.data || []);
        setPagination({
          total: response.data?.length || 0,
          page: 1,
          limit: 12,
          totalPages: 1,
        });
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      showToast('Failed to load properties. Please try again.', 'error');
      setProperties([]);
      setPagination({ total: 0, page: 1, limit: 12, totalPages: 0 });
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const response = await api.get('/properties/cities');
      setCities(response.data || []);
    } catch (error) {
      console.error('Error fetching cities:', error);
      setCities([]);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await api.get('/properties/locations');
      setLocations(response.data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocations([]);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-primary rounded-md flex items-center justify-center transform group-hover:scale-110 transition-transform">
                <span className="text-white font-bold text-lg">🏠</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">bayut</span>
            </Link>
            
            {/* Navigation */}
            <nav className="hidden xl:flex items-center gap-6 lg:gap-8">
              <Link href="/agents" className="text-gray-700 hover:text-primary font-medium transition-colors text-sm">
                Find my Agent
              </Link>
              <Link href="/properties/create" className="text-gray-700 hover:text-primary font-medium transition-colors text-sm flex items-center gap-1">
                Sell My Property
                <span className="bg-error text-white text-xs px-1.5 py-0.5 rounded">NEW</span>
              </Link>
              <Link href="/truestimate" className="text-gray-700 hover:text-primary font-medium transition-colors text-sm">
                TruEstimate™
              </Link>
              <Link href="/transactions" className="text-gray-700 hover:text-primary font-medium transition-colors text-sm">
                Dubai Transactions
              </Link>
              <Link href="/projects" className="text-gray-700 hover:text-primary font-medium transition-colors text-sm">
                New Projects
              </Link>
            </nav>
            
            {/* User Actions */}
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/properties/create"
                className="hidden sm:flex items-center gap-1 px-3 sm:px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all duration-200 font-medium text-xs sm:text-sm shadow-soft hover:shadow-medium"
              >
                <span>➕</span>
                <span className="hidden md:inline">Post Property</span>
              </Link>
              <button className="xl:hidden p-2 text-gray-700 hover:text-primary">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Search */}
      <div className="bg-gradient-to-b from-gray-50 to-white py-8 sm:py-12 border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search Bar */}
          <div className="bg-white rounded-xl shadow-medium p-4 sm:p-6 max-w-6xl mx-auto border border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              {/* Property Type Dropdown */}
              <div className="flex-1 w-full sm:min-w-[150px] lg:min-w-[200px]">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Properties</label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900 font-medium"
                  value={filters.type || ''}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value as PropertyType || undefined, page: 1 })}
                >
                  <option value="">All Properties</option>
                  <option value={PropertyType.APARTMENT}>Apartment</option>
                  <option value={PropertyType.VILLA}>Villa</option>
                  <option value={PropertyType.TOWNHOUSE}>Townhouse</option>
                  <option value={PropertyType.PENTHOUSE}>Penthouse</option>
                </select>
              </div>

              {/* Purpose Dropdown */}
              <div className="flex-1 w-full sm:min-w-[150px] lg:min-w-[200px]">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Buy / Rent</label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900 font-medium"
                  value={filters.purpose || ''}
                  onChange={(e) => setFilters({ ...filters, purpose: e.target.value as PropertyPurpose || undefined, page: 1 })}
                >
                  <option value="">All</option>
                  <option value={PropertyPurpose.SALE}>Buy</option>
                  <option value={PropertyPurpose.RENT}>Rent</option>
                </select>
              </div>
              
              {/* Location Input */}
              <div className="flex-1 w-full sm:min-w-[200px] lg:min-w-[250px]">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Location</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">📍</span>
                  <input
                    type="text"
                    placeholder="Enter location"
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-gray-900"
                    value={filters.location || ''}
                    onChange={(e) => setFilters({ ...filters, location: e.target.value || undefined, page: 1 })}
                  />
                </div>
              </div>
              
              {/* Search Button */}
              <div className="w-full sm:w-auto sm:min-w-[120px]">
                <button
                  onClick={fetchProperties}
                  className="w-full px-6 py-3 bg-accent text-white rounded-lg font-semibold hover:bg-accent-dark transition-all duration-200 shadow-soft hover:shadow-medium transform hover:-translate-y-0.5"
                >
                  Find
                </button>
              </div>
            </div>
            
            {/* BayutGPT Link */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>🏠</span>
              <span>Want to find out more about UAE real estate using AI?</span>
              <button
                onClick={() => setShowBayutGPTPopup(true)}
                className="text-primary font-medium hover:underline cursor-pointer"
              >
                Try BayutGPT →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Properties Section */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Properties {filters.purpose ? `for ${filters.purpose}` : ''} in UAE
            </h2>
            <p className="text-gray-600 text-sm">
              {pagination.total > 0 ? pagination.total : properties.length} {pagination.total === 1 ? 'property' : 'properties'} found
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium shadow-soft hover:shadow-medium transition-all">
              List
            </button>
            <button
              onClick={() => {
                showToast('Map view coming soon! We\'re working on an interactive map to help you explore properties.', 'info');
              }}
              className="flex-1 sm:flex-none px-4 py-2 bg-white border-2 border-gray-300 rounded-lg text-sm font-medium hover:border-primary hover:text-primary transition-all"
            >
              Map
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-soft p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Purpose</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={filters.purpose || ''}
                onChange={(e) => setFilters({ ...filters, purpose: e.target.value as PropertyPurpose || undefined, page: 1 })}
              >
                <option value="">All</option>
                <option value={PropertyPurpose.SALE}>Sale</option>
                <option value={PropertyPurpose.RENT}>Rent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={filters.type || ''}
                onChange={(e) => setFilters({ ...filters, type: e.target.value as PropertyType || undefined, page: 1 })}
              >
                <option value="">All</option>
                <option value={PropertyType.APARTMENT}>Apartment</option>
                <option value={PropertyType.VILLA}>Villa</option>
                <option value={PropertyType.TOWNHOUSE}>Townhouse</option>
                <option value={PropertyType.PENTHOUSE}>Penthouse</option>
                <option value={PropertyType.BUILDING}>Building</option>
                <option value={PropertyType.LAND}>Land</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">City</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={filters.city || ''}
                onChange={(e) => setFilters({ ...filters, city: e.target.value || undefined, page: 1 })}
              >
                <option value="">All Cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={filters.location || ''}
                onChange={(e) => setFilters({ ...filters, location: e.target.value || undefined, page: 1 })}
              >
                <option value="">All Locations</option>
                {locations.map((location) => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Min Price</label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                value={filters.minPrice || ''}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
                placeholder="Min"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Max Price</label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                value={filters.maxPrice || ''}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
                placeholder="Max"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Bedrooms</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={filters.bedrooms || ''}
                onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
              >
                <option value="">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Bathrooms</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={filters.bathrooms || ''}
                onChange={(e) => setFilters({ ...filters, bathrooms: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
              >
                <option value="">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Min Area (sqft)</label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                value={filters.minAreaSize || ''}
                onChange={(e) => setFilters({ ...filters, minAreaSize: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
                placeholder="Min"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Max Area (sqft)</label>
              <input
                type="number"
                className="w-full border rounded px-3 py-2"
                value={filters.maxAreaSize || ''}
                onChange={(e) => setFilters({ ...filters, maxAreaSize: e.target.value ? Number(e.target.value) : undefined, page: 1 })}
                placeholder="Max"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
            <p className="mt-6 text-gray-600 text-lg font-medium">Loading properties...</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🏠</div>
            <p className="text-gray-700 text-xl font-semibold mb-2">No properties found</p>
            <p className="text-gray-500">Try adjusting your search filters</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {properties.map((property) => {
                const propertyId = property.id || property._id || Math.random().toString();
                return <PropertyCard key={propertyId} property={property} />;
              })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} properties
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setFilters({ ...filters, page: pagination.page - 1 });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  
                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => {
                            setFilters({ ...filters, page: pageNum });
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            pagination.page === pageNum
                              ? 'bg-primary text-white'
                              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => {
                      setFilters({ ...filters, page: pagination.page + 1 });
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* BayutGPT Coming Soon Popup */}
      {showBayutGPTPopup && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowBayutGPTPopup(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowBayutGPTPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center">
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">BayutGPT</h2>
              <p className="text-gray-600 text-lg mb-6">
                Coming Soon!
              </p>
              <p className="text-gray-500 text-sm mb-6">
                We're working on an AI-powered assistant to help you find the perfect property in UAE. Stay tuned for updates!
              </p>
              <button
                onClick={() => setShowBayutGPTPopup(false)}
                className="w-full px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-all shadow-soft hover:shadow-medium"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

