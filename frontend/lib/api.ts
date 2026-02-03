import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      if (
        window.location.pathname !== "/login" &&
        window.location.pathname !== "/register"
      ) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// Invoice API
export const invoiceApi = {
  getAll: () => apiClient.get("/v1/invoices"),
  getById: (id: string) => apiClient.get(`/v1/invoices/${id}`),
  create: (data: any) => apiClient.post("/v1/invoices", data),
  update: (id: string, data: any) => apiClient.patch(`/v1/invoices/${id}`, data),
  send: (id: string) => apiClient.post(`/v1/invoices/${id}/send`),
  void: (id: string) => apiClient.post(`/v1/invoices/${id}/void`),
  revise: (id: string) => apiClient.post(`/v1/invoices/${id}/revise`),
  getPdf: (id: string, signed?: boolean) =>
    apiClient.get(`/v1/invoices/${id}/pdf`, {
      params: { signed },
      responseType: "blob",
    }),
};

// Client API
export const clientApi = {
  getAll: () => apiClient.get("/v1/clients"),
  getById: (id: string) => apiClient.get(`/v1/clients/${id}`),
  create: (data: any) => apiClient.post("/v1/clients", data),
  update: (id: string, data: any) => apiClient.patch(`/v1/clients/${id}`, data),
  archive: (id: string) => apiClient.patch(`/v1/clients/${id}/archive`),
};

// Payment API
export const paymentApi = {
  create: (invoiceId: string, data: any) =>
    apiClient.post(`/v1/invoices/${invoiceId}/payments`, data),
  getByInvoice: (invoiceId: string) =>
    apiClient.get(`/v1/invoices/${invoiceId}/payments`),
  createReversal: (invoiceId: string, data: any) =>
    apiClient.post(`/v1/invoices/${invoiceId}/payments/reversal`, data),
};

// Business API
export const businessApi = {
  getCurrent: () => apiClient.get("/v1/business"),
  update: (data: any) => apiClient.put("/v1/business", data),
  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append("logo", file);
    return apiClient.post("/v1/business/logo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// Setup API
export const setupApi = {
  getStatus: () => apiClient.get("/v1/setup/status"),
  createOwner: (data: any) => apiClient.post("/v1/setup/owner", data),
};

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post("/v1/auth/login", { email, password }),
  me: () => apiClient.get("/v1/auth/me"),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post("/v1/auth/change-password", {
      currentPassword,
      newPassword,
    }),
};

export const receiptApi = {
  getPdf: (id: string) =>
    apiClient.get(`/v1/receipts/${id}/pdf`, { responseType: "blob" }),
};

export const publicApi = {
  viewInvoice: (token: string) =>
    apiClient.get(`/v1/public/invoices/view/${token}`),
  viewInvoiceForSign: (token: string) =>
    apiClient.get(`/v1/public/invoices/sign/${token}`),
  getInvoicePdf: (token: string, signed?: boolean) =>
    apiClient.get(`/v1/public/invoices/pdf/${token}`, {
      params: { signed },
      responseType: "blob",
    }),
  signInvoice: (token: string, data: any) =>
    apiClient.post(`/v1/public/invoices/sign/${token}`, data),
};

export { API_URL };
export default apiClient;
