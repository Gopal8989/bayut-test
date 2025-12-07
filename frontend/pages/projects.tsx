import Link from 'next/link';
import Head from 'next/head';

export default function NewProjects() {
  return (
    <>
      <Head>
        <title>New Projects - Bayut Clone</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full text-center">
          {/* Icon */}
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-purple-100 rounded-full mb-6">
              <span className="text-5xl">🏗️</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            New Projects
          </h1>

          {/* Subtitle */}
          <p className="text-xl sm:text-2xl text-gray-600 mb-8">
            Coming Soon!
          </p>

          {/* Description */}
          <p className="text-gray-500 text-lg mb-10 max-w-lg mx-auto">
            Discover the latest off-plan and new development projects in UAE. 
            Be the first to know about upcoming properties.
          </p>

          {/* Features Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100">
              <div className="text-3xl mb-3">🏢</div>
              <h3 className="font-semibold text-gray-900 mb-2">Off-Plan Projects</h3>
              <p className="text-sm text-gray-600">Browse upcoming developments</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100">
              <div className="text-3xl mb-3">📍</div>
              <h3 className="font-semibold text-gray-900 mb-2">Location Maps</h3>
              <p className="text-sm text-gray-600">See project locations</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100">
              <div className="text-3xl mb-3">📅</div>
              <h3 className="font-semibold text-gray-900 mb-2">Completion Dates</h3>
              <p className="text-sm text-gray-600">Track project timelines</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100">
              <div className="text-3xl mb-3">💎</div>
              <h3 className="font-semibold text-gray-900 mb-2">Early Access</h3>
              <p className="text-sm text-gray-600">Get exclusive project previews</p>
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

