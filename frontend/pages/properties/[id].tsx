import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import api, { getErrorMessage } from '../../lib/api';
import { Property } from '../../lib/types';
import { useToast } from '../../components/ToastContainer';
import LoadingSpinner from '../../components/LoadingSpinner';
import ImageGallery from '../../components/ImageGallery';
import ContactModal from '../../components/ContactModal';
import { getImageUrls } from '../../lib/imageUtils';

export default function PropertyDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { showToast } = useToast();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    // Wait for router to be ready and check if id exists
    if (router.isReady) {
      if (!id || id === 'undefined' || id === 'null') {
        setError('Invalid property ID');
        setLoading(false);
        showToast('Invalid property ID', 'error');
        return;
      }
      fetchProperty();
    }
  }, [router.isReady, id]);

  const fetchProperty = async () => {
    if (!id || id === 'undefined' || id === 'null') {
      setError('Invalid property ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/properties/${id}`);
      if (response.data) {
        console.log('Property data received:', response.data);
        console.log('Property images:', response.data.images);
        setProperty(response.data);
      } else {
        setError('Property not found');
        showToast('Property not found', 'error');
      }
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      showToast(errorMessage, 'error');
      console.error('Error fetching property:', error);
      
      // If 404, set property to null to show not found message
      if (error?.response?.status === 404) {
        setProperty(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading property details..." />
      </div>
    );
  }

  if (error || !property) {
    return (
      <>
        <Head>
          <title>Property Not Found - Bayut Clone</title>
        </Head>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center px-4">
            <div className="text-6xl mb-4">🏠</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Property not found</h1>
            {error && (
              <p className="text-gray-600 mb-4">{error}</p>
            )}
            <Link 
              href="/" 
              className="text-primary hover:text-primary-dark font-medium inline-block px-6 py-3 bg-primary-light rounded-lg hover:bg-primary-lighter transition-colors"
            >
              ← Go back to listings
            </Link>
          </div>
        </div>
      </>
    );
  }

  // Process images - if no images, ImageGallery will show default
  const images = property.images;

  return (
    <>
      <Head>
        <title>{property.title} - Bayut Clone</title>
        <meta name="description" content={property.description} />
      </Head>
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 bg-gradient-primary rounded-md flex items-center justify-center transform group-hover:scale-110 transition-transform">
                  <span className="text-white font-bold text-lg">🏠</span>
                </div>
                <span className="text-2xl font-bold text-gray-900">bayut</span>
              </Link>
              <Link href="/" className="text-gray-700 hover:text-primary font-medium transition-colors flex items-center gap-2">
                <span>←</span> Back to Listings
              </Link>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Images Gallery */}
              <ImageGallery images={images} title={property.title} />

              {/* Property Info Card */}
              <div className="bg-white rounded-xl shadow-medium p-4 sm:p-6 mb-6">
                {/* Title and Price */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex-1">{property.title}</h1>
                    <div className="text-left sm:text-right flex-shrink-0">
                      <div className="text-2xl sm:text-3xl font-bold text-primary mb-1">{formatPrice(property.price)}</div>
                      {property.purpose === 'rent' && (
                        <span className="text-sm text-gray-600">per year</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 mb-3">
                    <span>📍</span>
                    <span className="text-lg">{property.location}, {property.city}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-4 py-1.5 rounded-lg text-sm font-semibold ${
                      property.purpose === 'sale' 
                        ? 'bg-success text-white' 
                        : 'bg-accent text-white'
                    }`}>
                      {property.purpose === 'sale' ? 'FOR SALE' : 'FOR RENT'}
                    </span>
                    <span className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold capitalize">
                      {property.type}
                    </span>
                  </div>
                </div>

                {/* Property Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-6">
                  {property.bedrooms && (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-3xl mb-2">🛏️</div>
                      <div className="text-2xl font-bold text-primary mb-1">{property.bedrooms}</div>
                      <div className="text-sm text-gray-600 font-medium">Bedrooms</div>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-3xl mb-2">🚿</div>
                      <div className="text-2xl font-bold text-primary mb-1">{property.bathrooms}</div>
                      <div className="text-sm text-gray-600 font-medium">Bathrooms</div>
                    </div>
                  )}
                  {property.parking !== null && property.parking !== undefined && (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-3xl mb-2">🚗</div>
                      <div className="text-2xl font-bold text-primary mb-1">{property.parking}</div>
                      <div className="text-sm text-gray-600 font-medium">Parking</div>
                    </div>
                  )}
                  {property.areaSize && (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-3xl mb-2">📐</div>
                      <div className="text-2xl font-bold text-primary mb-1">{property.areaSize}</div>
                      <div className="text-sm text-gray-600 font-medium">Sqft</div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
                  <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">{property.description}</p>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              {/* Contact Card */}
              <div className="bg-white rounded-xl shadow-medium p-4 sm:p-6 sticky top-20 lg:top-24 mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Agent</h3>
                {(property.contactName || property.contactPhone || property.contactEmail) ? (
                  <div className="space-y-4">
                    {property.contactName && (
                      <div>
                        <label className="text-sm font-semibold text-gray-600 block mb-1">Name</label>
                        <p className="text-gray-900 font-medium">{property.contactName}</p>
                      </div>
                    )}
                    {property.contactPhone && (
                      <div>
                        <label className="text-sm font-semibold text-gray-600 block mb-1">Phone</label>
                        <a href={`tel:${property.contactPhone}`} className="text-primary hover:text-primary-dark font-medium">
                          {property.contactPhone}
                        </a>
                      </div>
                    )}
                    {property.contactEmail && (
                      <div>
                        <label className="text-sm font-semibold text-gray-600 block mb-1">Email</label>
                        <a href={`mailto:${property.contactEmail}`} className="text-primary hover:text-primary-dark font-medium break-all">
                          {property.contactEmail}
                        </a>
                      </div>
                    )}
                    <button 
                      onClick={() => setShowContactModal(true)}
                      className="w-full mt-6 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-all shadow-soft hover:shadow-medium"
                    >
                      Request Details
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">📧</div>
                    <p className="text-gray-600 mb-4">No contact information available</p>
                    <Link href="/login" className="text-primary hover:text-primary-dark font-medium">
                      Login to contact
                    </Link>
                  </div>
                )}
              </div>

              {/* Property Summary */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Property Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium text-gray-900 capitalize">{property.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Purpose:</span>
                    <span className="font-medium text-gray-900 capitalize">{property.purpose}</span>
                  </div>
                  {property.area && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Area:</span>
                      <span className="font-medium text-gray-900">{property.area}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium text-gray-900">{property.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">City:</span>
                    <span className="font-medium text-gray-900">{property.city}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {property && (
        <ContactModal
          isOpen={showContactModal}
          onClose={() => setShowContactModal(false)}
          propertyTitle={property.title}
          propertyId={property.id?.toString() || property._id || ''}
          contactEmail={property.contactEmail}
          contactPhone={property.contactPhone}
          contactName={property.contactName}
        />
      )}
    </>
  );
}

