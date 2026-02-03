'use client';

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/app/contexts/ThemeContext';
import { AppProvider, useApp } from '@/app/contexts/AppContext';
import { Toaster } from '@/app/components/ui/sonner';

// Pages
import { Login } from '@/app/pages/Login';
import { Invoices } from '@/app/pages/Invoices';
import { InvoiceDetails } from '@/app/pages/InvoiceDetails';
import { CreateInvoice } from '@/app/pages/CreateInvoice';
import { InvoicePreview } from '@/app/pages/InvoicePreview';
import { Clients } from '@/app/pages/Clients';
import { Settings } from '@/app/pages/Settings';
import { PublicInvoiceView } from '@/app/pages/PublicInvoiceView';
import { PublicSignPage } from '@/app/pages/PublicSignPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useApp();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function AppRoutes() {
  const { isAuthenticated } = useApp();

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/invoices" /> : <Login />} 
      />
      <Route path="/i/:token" element={<PublicInvoiceView />} />
      <Route path="/i/:token/sign" element={<PublicSignPage />} />

      {/* Private Routes */}
      <Route
        path="/invoices"
        element={
          <PrivateRoute>
            <Invoices />
          </PrivateRoute>
        }
      />
      <Route
        path="/invoices/new"
        element={
          <PrivateRoute>
            <CreateInvoice />
          </PrivateRoute>
        }
      />
      <Route
        path="/invoices/:id"
        element={
          <PrivateRoute>
            <InvoiceDetails />
          </PrivateRoute>
        }
      />
      <Route
        path="/invoices/:id/edit"
        element={
          <PrivateRoute>
            <CreateInvoice />
          </PrivateRoute>
        }
      />
      <Route
        path="/invoices/:id/preview"
        element={
          <PrivateRoute>
            <InvoicePreview />
          </PrivateRoute>
        }
      />
      <Route
        path="/clients"
        element={
          <PrivateRoute>
            <Clients />
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <Settings />
          </PrivateRoute>
        }
      />

      {/* Redirect root */}
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? "/invoices" : "/login"} />}
      />

      {/* 404 */}
      <Route
        path="*"
        element={
          <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="text-center">
              <h1 className="text-4xl font-semibold mb-2">404</h1>
              <p className="text-muted-foreground">Page not found</p>
            </div>
          </div>
        }
      />
    </Routes>
  );
}

export default function ClientApp() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppProvider>
          <AppRoutes />
          <Toaster position="top-right" />
        </AppProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
