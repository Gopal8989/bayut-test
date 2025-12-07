import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api, { getErrorMessage } from '../lib/api';
import { setAuthToken, setRefreshToken, setUser } from '../lib/auth';
import { useToast } from '../components/ToastContainer';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Register() {
  const router = useRouter();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/register', formData);
      setAuthToken(response.data.access_token);
      if (response.data.refresh_token) {
        setRefreshToken(response.data.refresh_token);
      }
      if (response.data.user) {
        setUser(response.data.user);
      }
      showToast('Registration successful! Welcome!', 'success');
      router.push('/');
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* Backdrop blur effect */}
      <div className="absolute inset-0 bg-gray-900 opacity-50 backdrop-blur-sm"></div>
      
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl relative z-10 p-8">
        {/* Close button */}
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="text-primary hover:text-primary-dark">
            ← Back
          </Link>
          <Link href="/" className="text-gray-400 hover:text-gray-600">
            ✕
          </Link>
        </div>

        <div className="mb-8">
          <Link href="/" className="text-center block mb-2">
            <h2 className="text-3xl font-bold text-primary">bayut</h2>
          </Link>
          <h2 className="text-center text-2xl font-semibold text-gray-900">
            Create your account
          </h2>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                className="w-full px-4 py-3 border border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                className="w-full px-4 py-3 border border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-4 py-3 border border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full px-4 py-3 border border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter password (min 6 characters)"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className="w-full px-4 py-3 border border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-primary text-white rounded-md font-medium hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Creating account...</span>
                </>
              ) : (
                'Sign up'
              )}
            </button>
          </div>

          <div className="text-center pt-4">
            <span className="text-gray-600">Already have an account? </span>
            <Link href="/login" className="text-primary font-medium hover:text-primary-dark">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

