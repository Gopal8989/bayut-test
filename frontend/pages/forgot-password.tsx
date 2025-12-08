import { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import api, { getErrorMessage } from '../lib/api';
import { useToast } from '../components/ToastContainer';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ForgotPassword() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
      showToast(response.data?.message || 'Password reset email sent! Check your inbox.', 'success');
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Forgot Password - Bayut Clone</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-large p-8 border border-gray-200">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto">
                <span className="text-white font-bold text-2xl">🏠</span>
              </div>
            </Link>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
            <p className="text-gray-600">
              {submitted
                ? 'Check your email for password reset instructions'
                : 'Enter your email address and we\'ll send you a link to reset your password'}
            </p>
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="input-field"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Sending...</span>
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>

              <div className="text-center pt-4">
                <Link href="/login" className="text-primary hover:text-primary-dark font-medium text-sm">
                  ← Back to Login
                </Link>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">📧</div>
              <p className="text-gray-700">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="text-sm text-gray-600">
                Please check your email and click the link to reset your password.
              </p>
              <div className="pt-4 space-y-2">
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-primary hover:text-primary-dark font-medium text-sm"
                >
                  Send another email
                </button>
                <div>
                  <Link href="/login" className="text-gray-600 hover:text-gray-900 text-sm">
                    ← Back to Login
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

