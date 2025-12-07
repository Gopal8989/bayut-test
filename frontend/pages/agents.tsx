import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';

export default function FindAgent() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Find My Agent - Bayut Clone</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center">
          {/* Icon */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-primary-light rounded-full mb-6">
              <span className="text-5xl">👨‍💼</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Find My Agent
          </h1>

          {/* Subtitle */}
          <p className="text-xl sm:text-2xl text-gray-600 mb-8">
            Coming Soon!
          </p>

          {/* Description */}
          <p className="text-gray-500 text-lg mb-10 max-w-lg mx-auto">
            We're building an amazing platform to connect you with the best real estate agents in UAE. 
            Stay tuned for updates!
          </p>

          {/* Features Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100">
              <div className="text-3xl mb-3">🔍</div>
              <h3 className="font-semibold text-gray-900 mb-2">Search Agents</h3>
              <p className="text-sm text-gray-600">Find verified agents by location and expertise</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100">
              <div className="text-3xl mb-3">⭐</div>
              <h3 className="font-semibold text-gray-900 mb-2">Ratings & Reviews</h3>
              <p className="text-sm text-gray-600">Read reviews from verified clients</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100">
              <div className="text-3xl mb-3">💬</div>
              <h3 className="font-semibold text-gray-900 mb-2">Direct Contact</h3>
              <p className="text-sm text-gray-600">Connect directly with agents</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-all shadow-soft hover:shadow-medium"
            >
              Browse Properties
            </Link>
            <Link
              href="/properties/create"
              className="px-8 py-3 bg-white border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary-light transition-all"
            >
              List Your Property
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

