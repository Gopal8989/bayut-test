import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api, { getErrorMessage } from '../../../lib/api';
import { PropertyType, PropertyPurpose } from '../../../lib/types';
import { useToast } from '../../../components/ToastContainer';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function EditProperty() {
  const router = useRouter();
  const { id } = router.query;
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    type: PropertyType.APARTMENT,
    purpose: PropertyPurpose.SALE,
    location: '',
    city: '',
    area: '',
    bedrooms: '',
    bathrooms: '',
    parking: '',
    areaSize: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
  });
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id && router.isReady) {
      fetchProperty();
    }
  }, [id, router.isReady]);

  const fetchProperty = async () => {
    if (!id || id === 'undefined' || id === 'null') {
      setError('Invalid property ID');
      setFetching(false);
      return;
    }

    try {
      setFetching(true);
      const response = await api.get(`/properties/${id}`);
      const data = response.data?.data || response.data;
      
      if (data) {
        setFormData({
          title: data.title || '',
          description: data.description || '',
          price: data.price?.toString() || '',
          type: data.type || PropertyType.APARTMENT,
          purpose: data.purpose || PropertyPurpose.SALE,
          location: data.location || '',
          city: data.city || '',
          area: data.area || '',
          bedrooms: data.bedrooms?.toString() || '',
          bathrooms: data.bathrooms?.toString() || '',
          parking: data.parking?.toString() || '',
          areaSize: data.areaSize?.toString() || '',
          contactName: data.contactName || '',
          contactPhone: data.contactPhone || '',
          contactEmail: data.contactEmail || '',
        });
        setExistingImages(Array.isArray(data.images) ? data.images : []);
      }
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImages([...images, ...filesArray]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const updateData: any = {};
      
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          if (['bedrooms', 'bathrooms', 'parking', 'areaSize', 'price'].includes(key)) {
            updateData[key] = Number(value);
          } else {
            updateData[key] = value;
          }
        }
      });

      await api.put(`/properties/${id}`, updateData);

      showToast('Property updated successfully!', 'success');
      router.push('/my-properties');
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading property..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <Link href="/my-properties" className="flex items-center gap-2">
              <span className="text-3xl font-bold text-primary">bayut</span>
            </Link>
            <Link href="/my-properties" className="text-gray-700 hover:text-primary font-medium">
              ← Back to My Properties
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Edit Property</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.title}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description *</label>
                  <textarea
                    name="description"
                    required
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Purpose *</label>
                    <select
                      name="purpose"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.purpose}
                      onChange={handleChange}
                    >
                      <option value={PropertyPurpose.SALE}>Sale</option>
                      <option value={PropertyPurpose.RENT}>Rent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Type *</label>
                    <select
                      name="type"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.type}
                      onChange={handleChange}
                    >
                      <option value={PropertyType.APARTMENT}>Apartment</option>
                      <option value={PropertyType.VILLA}>Villa</option>
                      <option value={PropertyType.TOWNHOUSE}>Townhouse</option>
                      <option value={PropertyType.PENTHOUSE}>Penthouse</option>
                      <option value={PropertyType.BUILDING}>Building</option>
                      <option value={PropertyType.LAND}>Land</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Price (AED) *</label>
                  <input
                    type="number"
                    name="price"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.price}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Location</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City *</label>
                  <input
                    type="text"
                    name="city"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Location *</label>
                  <input
                    type="text"
                    name="location"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.location}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Area</label>
                  <input
                    type="text"
                    name="area"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.area}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Property Details</h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Bedrooms</label>
                  <input
                    type="number"
                    name="bedrooms"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.bedrooms}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Bathrooms</label>
                  <input
                    type="number"
                    name="bathrooms"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.bathrooms}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Parking</label>
                  <input
                    type="number"
                    name="parking"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.parking}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Area Size (sqft)</label>
                  <input
                    type="number"
                    name="areaSize"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.areaSize}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Property Images</h2>
              {existingImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Existing Images:</p>
                  <div className="grid grid-cols-4 gap-4">
                    {existingImages.map((imageUrl, index) => (
                      <div key={index} className="relative">
                        <img
                          src={imageUrl}
                          alt={`Existing ${index + 1}`}
                          className="w-full h-32 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {images.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Name</label>
                  <input
                    type="text"
                    name="contactName"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.contactName}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Contact Phone <span className="text-gray-400 text-xs">(Optional)</span></label>
                    <input
                      type="tel"
                      name="contactPhone"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.contactPhone}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Contact Email</label>
                    <input
                      type="email"
                      name="contactEmail"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      value={formData.contactEmail}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary text-white rounded-md font-medium hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Updating Property...</span>
                </>
              ) : (
                'Update Property'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

