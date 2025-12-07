import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import api, { getErrorMessage } from '../lib/api';
import { Property, FilterParams, PropertyPurpose, PropertyType } from '../lib/types';
import { useToast } from '../components/ToastContainer';
import LoadingSpinner from '../components/LoadingSpinner';
import PropertyCard from '../components/PropertyCard';
import { useAuth } from '../hooks/useAuth';

export default function MyProperties() {
  const router = useRouter();
  const { showToast } = useToast();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterParams>({ page: 1, limit: 12 });
  const [cities, setCities] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 12,
    totalPages: 0,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    } else if (isAuthenticated) {
      fetchProperties();
      fetchCities();
      fetchLocations();
    }
  }, [isAuthenticated, authLoading, filters]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
      if (!params.has('page')) params.append('page', '1');
      if (!params.has('limit')) params.append('limit', '12');
      
      const queryString = params.toString();
      const url = `/properties/my-properties?${queryString}`;
      const response = await api.get(url);
      
      if (response.data && response.data.data) {
        setProperties(response.data.data || []);
        setPagination({
          total: response.data.total || 0,
          page: response.data.page || 1,
          limit: response.data.limit || 12,
          totalPages: response.data.totalPages || 0,
        });
      } else {
        setProperties(response.data || []);
        setPagination({ total: 0, page: 1, limit: 12, totalPages: 0 });
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      showToast('Failed to load your properties. Please try again.', 'error');
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your properties..." />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Properties - Bayut Clone</title>
      </Head>
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 bg-gradient-primary rounded-md flex items-center justify-center transform group-hover:scale-110 transition-transform">
                  <span className="text-white font-bold text-lg">🏠</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">bayut</span>
              </Link>
              <Link href="/properties/create" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all font-medium text-sm">
                + Add Property
              </Link>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">My Properties</h1>
              <p className="text-gray-600 text-sm">
                {pagination.total > 0 ? pagination.total : properties.length} {pagination.total === 1 ? 'property' : 'properties'} found
              </p>
            </div>
            <Link
              href="/properties/create"
              className="px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-all shadow-soft hover:shadow-medium"
            >
              + Create New Property
            </Link>
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
            </div>
          </div>

          {/* Properties Grid */}
          {loading ? (
            <div className="text-center py-20">
              <LoadingSpinner size="lg" text="Loading your properties..." />
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🏠</div>
              <p className="text-gray-700 text-xl font-semibold mb-2">No properties found</p>
              <p className="text-gray-500 mb-6">You haven't created any properties yet.</p>
              <Link
                href="/properties/create"
                className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-all shadow-soft hover:shadow-medium"
              >
                Create Your First Property
              </Link>
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
      </div>
    </>
  );
}

