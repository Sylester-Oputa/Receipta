import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API methods for receipts
export const receiptsApi = {
  // Get all receipts
  getAll: async () => {
    const response = await api.get('/receipts');
    return response.data;
  },

  // Get receipt by ID
  getById: async (id) => {
    const response = await api.get(`/receipts/${id}`);
    return response.data;
  },

  // Create new receipt
  create: async (receiptData) => {
    const response = await api.post('/receipts', receiptData);
    return response.data;
  },

  // Update receipt
  update: async (id, receiptData) => {
    const response = await api.put(`/receipts/${id}`, receiptData);
    return response.data;
  },

  // Delete receipt
  delete: async (id) => {
    const response = await api.delete(`/receipts/${id}`);
    return response.data;
  },
};

// Health check
export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;
