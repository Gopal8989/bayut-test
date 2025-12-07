import { useEffect } from 'react';
import Head from 'next/head';

export default function ApiDocs() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const swaggerUrl = `${apiUrl}/api-docs`;
      window.location.href = swaggerUrl;
    }
  }, []);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const swaggerUrl = `${apiUrl}/api-docs`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light to-gray-50 flex items-center justify-center">
      <Head>
        <title>API Documentation - Bayut Clone</title>
      </Head>
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">Redirecting to API Documentation...</p>
        <a
          href={swaggerUrl}
          className="mt-4 inline-block text-primary hover:text-primary-dark font-medium"
        >
          Click here if not redirected automatically
        </a>
      </div>
    </div>
  );
}

