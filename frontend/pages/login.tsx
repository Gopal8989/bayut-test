import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import api, { getErrorMessage } from '../lib/api';
import { setAuthToken, setRefreshToken, setUser } from '../lib/auth';
import { useToast } from '../components/ToastContainer';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Login() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      setAuthToken(response.data.access_token);
      if (response.data.refresh_token) {
        setRefreshToken(response.data.refresh_token);
      }
      if (response.data.user) {
        setUser(response.data.user);
      }
      showToast('Login successful!', 'success');
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
            Log in
          </h2>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full px-4 py-3 border border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 border border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent pr-10"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <div className="mt-2">
              <Link href="/forgot-password" className="text-sm text-primary hover:text-primary-dark">
                Forgot your password?
              </Link>
            </div>
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
                  <span>Signing in...</span>
                </>
              ) : (
                'Log in'
              )}
            </button>
          </div>

          <div className="text-center pt-4">
            <span className="text-gray-600">New to Bayut? </span>
            <Link href="/register" className="text-primary font-medium hover:text-primary-dark">
              Create an account
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

