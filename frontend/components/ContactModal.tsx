import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api, { getErrorMessage } from '../lib/api';
import { useToast } from './ToastContainer';
import LoadingSpinner from './LoadingSpinner';
import { getUser } from '../lib/auth';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyTitle: string;
  propertyId: string;
  contactEmail?: string;
  contactPhone?: string;
  contactName?: string;
}

const ContactModal: React.FC<ContactModalProps> = ({
  isOpen,
  onClose,
  propertyTitle,
  propertyId,
  contactEmail,
  contactPhone,
  contactName,
}) => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });

  // Pre-fill form with user profile data if available
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      const user = getUser();
      if (user) {
        setFormData(prev => ({
          ...prev,
          name: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email,
        }));
      }

      // Try to fetch full profile for phone number
      api.get('/users/profile')
        .then(response => {
          if (response.data) {
            setFormData(prev => ({
              ...prev,
              name: `${response.data.firstName || ''} ${response.data.lastName || ''}`.trim() || prev.name,
              email: response.data.email || prev.email,
              phone: response.data.phone || prev.phone,
            }));
          }
        })
        .catch(() => {
          // Silently fail, use basic user data
        });
    }
  }, [isAuthenticated, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      showToast('Please login to contact the agent', 'error');
      return;
    }

    if (!contactEmail) {
      showToast('Contact email not available for this property', 'error');
      return;
    }

    setLoading(true);
    try {
      // Send inquiry to backend API
      await api.post('/properties/contact', {
        propertyId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
      });

      showToast('Your inquiry has been sent successfully!', 'success');
      
      // Reset form
      setFormData({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectContact = (type: 'email' | 'phone') => {
    if (type === 'email' && contactEmail) {
      const subject = encodeURIComponent(`Inquiry about: ${propertyTitle}`);
      window.location.href = `mailto:${contactEmail}?subject=${subject}`;
    } else if (type === 'phone' && contactPhone) {
      window.location.href = `tel:${contactPhone}`;
    } else {
      showToast(`${type === 'email' ? 'Email' : 'Phone'} not available`, 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-large max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Contact Agent</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Property Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Property:</p>
            <p className="font-semibold text-gray-900">{propertyTitle}</p>
          </div>

          {/* Quick Contact Buttons */}
          {(contactEmail || contactPhone) && (
            <div className="grid grid-cols-2 gap-3 mb-6">
              {contactEmail && (
                <button
                  onClick={() => handleDirectContact('email')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
                >
                  <span>📧</span>
                  <span>Email</span>
                </button>
              )}
              {contactPhone && (
                <button
                  onClick={() => handleDirectContact('phone')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-success text-white rounded-lg font-medium hover:bg-success-dark transition-colors"
                >
                  <span>📞</span>
                  <span>Call</span>
                </button>
              )}
            </div>
          )}

          {/* Contact Form */}
          {isAuthenticated ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Email *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Phone <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  required
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="I'm interested in this property..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    'Send Inquiry'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🔒</div>
              <p className="text-gray-600 mb-4">Please login to contact the agent</p>
              <a
                href="/login"
                className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
              >
                Login
              </a>
            </div>
          )}

          {/* Contact Info Display */}
          {contactName && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Agent Information:</p>
              <p className="font-medium text-gray-900">{contactName}</p>
              {contactEmail && (
                <a href={`mailto:${contactEmail}`} className="text-primary hover:text-primary-dark text-sm">
                  {contactEmail}
                </a>
              )}
              {contactPhone && (
                <a href={`tel:${contactPhone}`} className="block text-primary hover:text-primary-dark text-sm">
                  {contactPhone}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactModal;

