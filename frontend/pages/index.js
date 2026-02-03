import Head from 'next/head';
import { useState, useEffect } from 'react';
import { receiptsApi, checkHealth } from '@/lib/api';

export default function Home() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState(null);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const data = await receiptsApi.getAll();
      setReceipts(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching receipts:', error);
      setError('Failed to fetch receipts. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const checkBackendHealth = async () => {
    try {
      const health = await checkHealth();
      setBackendStatus(health);
    } catch (error) {
      setBackendStatus({ status: 'error', message: 'Backend is not reachable' });
    }
  };

  useEffect(() => {
    checkBackendHealth();
    fetchReceipts();
  }, []);

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this receipt?')) {
      try {
        await receiptsApi.delete(id);
        fetchReceipts();
      } catch (error) {
        console.error('Error deleting receipt:', error);
        alert('Failed to delete receipt');
      }
    }
  };

  return (
    <>
      <Head>
        <title>Receipta - Manage Your Receipts</title>
        <meta name="description" content="Receipt management application" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Receipta
            </h1>
            <p className="text-gray-600">Manage your receipts with ease</p>
            
            {/* Backend Status */}
            {backendStatus && (
              <div className={`mt-4 inline-block px-4 py-2 rounded-lg ${
                backendStatus.status === 'ok' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                Backend: {backendStatus.message || backendStatus.status}
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              <p className="mt-4 text-gray-600">Loading receipts...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Receipts ({receipts.length})
                </h2>
              </div>

              {receipts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-md">
                  <p className="text-gray-500 text-lg">No receipts found.</p>
                  <p className="text-gray-400 mt-2">
                    Connect to the backend to start managing receipts.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {receipts.map((receipt) => (
                    <div
                      key={receipt.id}
                      className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                    >
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {receipt.title || 'Untitled Receipt'}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {receipt.description || 'No description'}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-green-600">
                          ${receipt.amount || '0.00'}
                        </span>
                        <button
                          onClick={() => handleDelete(receipt.id)}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
