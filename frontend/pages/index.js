import Head from 'next/head';
import { useState, useEffect } from 'react';
import ReceiptList from '@/components/receipts/ReceiptList';
import ReceiptForm from '@/components/receipts/ReceiptForm';

export default function Home() {
  const [receipts, setReceipts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingReceipt, setEditingReceipt] = useState(null);

  const fetchReceipts = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/receipts`);
      if (response.ok) {
        const data = await response.json();
        setReceipts(data);
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const handleEdit = (receipt) => {
    setEditingReceipt(receipt);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this receipt?')) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/receipts/${id}`,
          { method: 'DELETE' }
        );
        if (response.ok) {
          fetchReceipts();
        }
      } catch (error) {
        console.error('Error deleting receipt:', error);
      }
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingReceipt(null);
    fetchReceipts();
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
          </div>

          <div className="flex justify-end mb-6">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition duration-200"
            >
              {showForm ? 'Cancel' : '+ Add New Receipt'}
            </button>
          </div>

          {showForm && (
            <div className="mb-8">
              <ReceiptForm
                receipt={editingReceipt}
                onClose={handleFormClose}
              />
            </div>
          )}

          <ReceiptList
            receipts={receipts}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </main>
    </>
  );
}
