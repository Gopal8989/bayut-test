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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
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
      
      if (response.data?.data?.items) {
        setProperties(response.data.data.items || []);
        setPagination({
          total: response.data.data.total || 0,
          page: response.data.data.page || 1,
          limit: response.data.data.limit || 12,
          totalPages: response.data.data.totalPages || 0,
        });
      } else {
        setProperties(response.data?.data || response.data || []);
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
      let citiesData = null;
      
      // Handle different response structures
      if (response?.data?.data?.items) {
        citiesData = response.data.data.items;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        citiesData = response.data.data;
      } else if (response?.data?.items) {
        citiesData = response.data.items;
      } else if (Array.isArray(response?.data)) {
        citiesData = response.data;
      } else if (Array.isArray(response?.data?.data)) {
        citiesData = response.data.data;
      }
      
      setCities(Array.isArray(citiesData) ? citiesData : []);
    } catch (error) {
      console.error('Error fetching cities:', error);
      setCities([]);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await api.get('/properties/locations');
      let locationsData = null;
      
      // Handle different response structures
      if (response?.data?.data?.items) {
        locationsData = response.data.data.items;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        locationsData = response.data.data;
      } else if (response?.data?.items) {
        locationsData = response.data.items;
      } else if (Array.isArray(response?.data)) {
        locationsData = response.data;
      } else if (Array.isArray(response?.data?.data)) {
        locationsData = response.data.data;
      }
      
      setLocations(Array.isArray(locationsData) ? locationsData : []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocations([]);
    }
  };

  const handleDelete = async (propertyId: string) => {
    try {
      setDeletingId(propertyId);
      await api.delete(`/properties/${propertyId}`);
      showToast('Property deleted successfully!', 'success');
      setShowDeleteConfirm(null);
      fetchProperties();
    } catch (error) {
      console.error('Error deleting property:', error);
      showToast('Failed to delete property. Please try again.', 'error');
    } finally {
      setDeletingId(null);
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
                  {Array.isArray(cities) && cities.map((city) => (
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
                  {Array.isArray(locations) && locations.map((location) => (
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
                {Array.isArray(properties) && properties.map((property) => {
                  const propertyId = String(property.id || property._id || Math.random().toString());
                  return (
                    <div key={propertyId} className="relative group">
                      <PropertyCard property={property} />
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <Link
                          href={`/properties/edit/${propertyId}`}
                          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md"
                          title="Edit Property"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => setShowDeleteConfirm(propertyId)}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md"
                          title="Delete Property"
                          disabled={deletingId === propertyId}
                        >
                          {deletingId === propertyId ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Delete Confirmation Modal */}
              {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Property</h3>
                    <p className="text-gray-600 mb-6">
                      Are you sure you want to delete this property? This action cannot be undone.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleDelete(showDeleteConfirm)}
                        disabled={deletingId === showDeleteConfirm}
                        className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {deletingId === showDeleteConfirm ? 'Deleting...' : 'Delete'}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        disabled={deletingId === showDeleteConfirm}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

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

