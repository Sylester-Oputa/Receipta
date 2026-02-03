import React, { createContext, useContext, useState, useEffect } from 'react';

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'SIGNED' | 'PART_PAID' | 'PAID' | 'VOIDED';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  date: string;
  method: 'CASH' | 'TRANSFER' | 'POS';
  note: string;
  receiptNumber: string;
  balanceAfter: number;
}

export interface Signature {
  signerName: string;
  signerEmail: string;
  signedAt: string;
  signatureData: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string;
  viewToken: string;
  signToken: string;
  signature?: Signature;
  createdAt: string;
  sentAt?: string;
  version: number;
}

export interface TimelineEvent {
  id: string;
  invoiceId: string;
  type: 'CREATED' | 'SENT' | 'VIEWED' | 'SIGNED' | 'PAYMENT' | 'REVISED' | 'VOIDED';
  timestamp: string;
  description: string;
  metadata?: any;
}

export interface BusinessSettings {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  brandColor: string;
}

interface AppContextType {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  
  clients: Client[];
  addClient: (client: Omit<Client, 'id'>) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'viewToken' | 'signToken' | 'createdAt' | 'version'>) => void;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  sendInvoice: (id: string) => void;
  signInvoice: (signToken: string, signature: Signature) => boolean;
  voidInvoice: (id: string) => void;
  reviseInvoice: (id: string) => string;
  
  payments: Payment[];
  addPayment: (payment: Omit<Payment, 'id' | 'receiptNumber'>) => void;
  
  timeline: TimelineEvent[];
  getInvoiceTimeline: (invoiceId: string) => TimelineEvent[];
  
  settings: BusinessSettings;
  updateSettings: (settings: Partial<BusinessSettings>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultSettings: BusinessSettings = {
  businessName: 'Invoxa Demo Corp',
  address: '123 Business St, Suite 100, San Francisco, CA 94102',
  phone: '+1 (555) 123-4567',
  email: 'billing@invoxademo.com',
  bankName: 'Demo Bank',
  accountName: 'Invoxa Demo Corp',
  accountNumber: '1234567890',
  brandColor: '#3b82f6',
};

// Generate mock data
const generateMockClients = (): Client[] => [
  { id: 'c1', name: 'Acme Corporation', email: 'accounts@acme.com', phone: '+1 (555) 111-1111', address: '456 Tech Blvd, Austin, TX 78701' },
  { id: 'c2', name: 'TechStart Inc', email: 'billing@techstart.com', phone: '+1 (555) 222-2222', address: '789 Innovation Dr, Seattle, WA 98101' },
  { id: 'c3', name: 'Global Ventures Ltd', email: 'finance@globalventures.com', phone: '+1 (555) 333-3333', address: '321 Enterprise Way, New York, NY 10001' },
];

const generateMockInvoices = (clients: Client[]): Invoice[] => [
  {
    id: 'inv1',
    invoiceNumber: 'INV-2026-0001',
    clientId: clients[0].id,
    issueDate: '2026-01-15',
    dueDate: '2026-02-14',
    status: 'PAID',
    items: [
      { id: 'item1', description: 'Website Development', quantity: 1, unitPrice: 5000, total: 5000 },
      { id: 'item2', description: 'Hosting Setup', quantity: 1, unitPrice: 500, total: 500 },
    ],
    subtotal: 5500,
    taxRate: 10,
    taxAmount: 550,
    total: 6050,
    notes: 'Thank you for your business!',
    viewToken: 'view_abc123',
    signToken: 'sign_abc123',
    signature: {
      signerName: 'John Doe',
      signerEmail: 'john@acme.com',
      signedAt: '2026-01-16T10:30:00Z',
      signatureData: 'data:image/png;base64,mock_signature_data',
    },
    createdAt: '2026-01-15T09:00:00Z',
    sentAt: '2026-01-15T09:30:00Z',
    version: 1,
  },
  {
    id: 'inv2',
    invoiceNumber: 'INV-2026-0002',
    clientId: clients[1].id,
    issueDate: '2026-01-20',
    dueDate: '2026-02-19',
    status: 'PART_PAID',
    items: [
      { id: 'item3', description: 'Mobile App Development - Phase 1', quantity: 1, unitPrice: 12000, total: 12000 },
      { id: 'item4', description: 'UI/UX Design', quantity: 1, unitPrice: 3000, total: 3000 },
    ],
    subtotal: 15000,
    taxRate: 10,
    taxAmount: 1500,
    total: 16500,
    notes: 'Phase 1 deliverables included.',
    viewToken: 'view_def456',
    signToken: 'sign_def456',
    signature: {
      signerName: 'Sarah Smith',
      signerEmail: 'sarah@techstart.com',
      signedAt: '2026-01-21T14:20:00Z',
      signatureData: 'data:image/png;base64,mock_signature_data_2',
    },
    createdAt: '2026-01-20T11:00:00Z',
    sentAt: '2026-01-20T11:15:00Z',
    version: 1,
  },
  {
    id: 'inv3',
    invoiceNumber: 'INV-2026-0003',
    clientId: clients[2].id,
    issueDate: '2026-02-01',
    dueDate: '2026-03-03',
    status: 'SENT',
    items: [
      { id: 'item5', description: 'Consulting Services - January 2026', quantity: 40, unitPrice: 150, total: 6000 },
    ],
    subtotal: 6000,
    taxRate: 10,
    taxAmount: 600,
    total: 6600,
    notes: '',
    viewToken: 'view_ghi789',
    signToken: 'sign_ghi789',
    createdAt: '2026-02-01T08:00:00Z',
    sentAt: '2026-02-01T08:30:00Z',
    version: 1,
  },
  {
    id: 'inv4',
    invoiceNumber: 'INV-2026-0004',
    clientId: clients[0].id,
    issueDate: '2026-02-03',
    dueDate: '2026-03-05',
    status: 'DRAFT',
    items: [
      { id: 'item6', description: 'Database Optimization', quantity: 1, unitPrice: 2500, total: 2500 },
    ],
    subtotal: 2500,
    taxRate: 10,
    taxAmount: 250,
    total: 2750,
    notes: '',
    viewToken: 'view_jkl012',
    signToken: 'sign_jkl012',
    createdAt: '2026-02-03T10:00:00Z',
    version: 1,
  },
];

const generateMockPayments = (): Payment[] => [
  {
    id: 'pay1',
    invoiceId: 'inv1',
    amount: 6050,
    date: '2026-01-18',
    method: 'TRANSFER',
    note: 'Full payment received',
    receiptNumber: 'RCT-2026-0001',
    balanceAfter: 0,
  },
  {
    id: 'pay2',
    invoiceId: 'inv2',
    amount: 8000,
    date: '2026-01-25',
    method: 'TRANSFER',
    note: 'Partial payment',
    receiptNumber: 'RCT-2026-0002',
    balanceAfter: 8500,
  },
];

const generateMockTimeline = (): TimelineEvent[] => [
  { id: 'e1', invoiceId: 'inv1', type: 'CREATED', timestamp: '2026-01-15T09:00:00Z', description: 'Invoice created' },
  { id: 'e2', invoiceId: 'inv1', type: 'SENT', timestamp: '2026-01-15T09:30:00Z', description: 'Invoice sent to client' },
  { id: 'e3', invoiceId: 'inv1', type: 'VIEWED', timestamp: '2026-01-15T15:20:00Z', description: 'Client viewed invoice' },
  { id: 'e4', invoiceId: 'inv1', type: 'SIGNED', timestamp: '2026-01-16T10:30:00Z', description: 'Invoice signed by John Doe' },
  { id: 'e5', invoiceId: 'inv1', type: 'PAYMENT', timestamp: '2026-01-18T11:00:00Z', description: 'Payment received: $6,050.00' },
  { id: 'e6', invoiceId: 'inv2', type: 'CREATED', timestamp: '2026-01-20T11:00:00Z', description: 'Invoice created' },
  { id: 'e7', invoiceId: 'inv2', type: 'SENT', timestamp: '2026-01-20T11:15:00Z', description: 'Invoice sent to client' },
  { id: 'e8', invoiceId: 'inv2', type: 'SIGNED', timestamp: '2026-01-21T14:20:00Z', description: 'Invoice signed by Sarah Smith' },
  { id: 'e9', invoiceId: 'inv2', type: 'PAYMENT', timestamp: '2026-01-25T09:00:00Z', description: 'Payment received: $8,000.00' },
  { id: 'e10', invoiceId: 'inv3', type: 'CREATED', timestamp: '2026-02-01T08:00:00Z', description: 'Invoice created' },
  { id: 'e11', invoiceId: 'inv3', type: 'SENT', timestamp: '2026-02-01T08:30:00Z', description: 'Invoice sent to client' },
  { id: 'e12', invoiceId: 'inv4', type: 'CREATED', timestamp: '2026-02-03T10:00:00Z', description: 'Invoice created' },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [clients, setClients] = useState<Client[]>(generateMockClients());
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>(generateMockPayments());
  const [timeline, setTimeline] = useState<TimelineEvent[]>(generateMockTimeline());
  const [settings, setSettings] = useState<BusinessSettings>(defaultSettings);

  useEffect(() => {
    setInvoices(generateMockInvoices(clients));
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock login - accept any email/password for demo
    await new Promise(resolve => setTimeout(resolve, 500));
    if (email && password) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const addClient = (client: Omit<Client, 'id'>) => {
    const newClient: Client = {
      ...client,
      id: `c${Date.now()}`,
    };
    setClients(prev => [...prev, newClient]);
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id));
  };

  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const count = invoices.filter(inv => inv.invoiceNumber.startsWith(`INV-${year}`)).length + 1;
    return `INV-${year}-${String(count).padStart(4, '0')}`;
  };

  const addInvoice = (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'viewToken' | 'signToken' | 'createdAt' | 'version'>) => {
    const newInvoice: Invoice = {
      ...invoice,
      id: `inv${Date.now()}`,
      invoiceNumber: generateInvoiceNumber(),
      viewToken: `view_${Math.random().toString(36).substr(2, 9)}`,
      signToken: `sign_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      version: 1,
    };
    setInvoices(prev => [...prev, newInvoice]);
    
    const event: TimelineEvent = {
      id: `e${Date.now()}`,
      invoiceId: newInvoice.id,
      type: 'CREATED',
      timestamp: new Date().toISOString(),
      description: 'Invoice created',
    };
    setTimeline(prev => [...prev, event]);
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...updates } : inv));
  };

  const sendInvoice = (id: string) => {
    setInvoices(prev => prev.map(inv => 
      inv.id === id ? { ...inv, status: 'SENT', sentAt: new Date().toISOString() } : inv
    ));
    
    const event: TimelineEvent = {
      id: `e${Date.now()}`,
      invoiceId: id,
      type: 'SENT',
      timestamp: new Date().toISOString(),
      description: 'Invoice sent to client',
    };
    setTimeline(prev => [...prev, event]);
  };

  const signInvoice = (signToken: string, signature: Signature): boolean => {
    const invoice = invoices.find(inv => inv.signToken === signToken);
    if (!invoice || invoice.signature) return false;
    
    setInvoices(prev => prev.map(inv => 
      inv.signToken === signToken ? { ...inv, status: 'SIGNED', signature } : inv
    ));
    
    const event: TimelineEvent = {
      id: `e${Date.now()}`,
      invoiceId: invoice.id,
      type: 'SIGNED',
      timestamp: new Date().toISOString(),
      description: `Invoice signed by ${signature.signerName}`,
    };
    setTimeline(prev => [...prev, event]);
    
    return true;
  };

  const voidInvoice = (id: string) => {
    setInvoices(prev => prev.map(inv => 
      inv.id === id ? { ...inv, status: 'VOIDED' } : inv
    ));
    
    const event: TimelineEvent = {
      id: `e${Date.now()}`,
      invoiceId: id,
      type: 'VOIDED',
      timestamp: new Date().toISOString(),
      description: 'Invoice voided',
    };
    setTimeline(prev => [...prev, event]);
  };

  const reviseInvoice = (id: string): string => {
    const original = invoices.find(inv => inv.id === id);
    if (!original) return '';
    
    const revised: Invoice = {
      ...original,
      id: `inv${Date.now()}`,
      invoiceNumber: generateInvoiceNumber(),
      status: 'DRAFT',
      viewToken: `view_${Math.random().toString(36).substr(2, 9)}`,
      signToken: `sign_${Math.random().toString(36).substr(2, 9)}`,
      signature: undefined,
      createdAt: new Date().toISOString(),
      sentAt: undefined,
      version: original.version + 1,
    };
    
    setInvoices(prev => [...prev, revised]);
    
    const event: TimelineEvent = {
      id: `e${Date.now()}`,
      invoiceId: original.id,
      type: 'REVISED',
      timestamp: new Date().toISOString(),
      description: `Revised to ${revised.invoiceNumber}`,
    };
    setTimeline(prev => [...prev, event]);
    
    return revised.id;
  };

  const generateReceiptNumber = () => {
    const year = new Date().getFullYear();
    const count = payments.filter(p => p.receiptNumber.startsWith(`RCT-${year}`)).length + 1;
    return `RCT-${year}-${String(count).padStart(4, '0')}`;
  };

  const addPayment = (payment: Omit<Payment, 'id' | 'receiptNumber'>) => {
    const invoice = invoices.find(inv => inv.id === payment.invoiceId);
    if (!invoice) return;
    
    const totalPaid = payments
      .filter(p => p.invoiceId === payment.invoiceId)
      .reduce((sum, p) => sum + p.amount, 0) + payment.amount;
    
    const newPayment: Payment = {
      ...payment,
      id: `pay${Date.now()}`,
      receiptNumber: generateReceiptNumber(),
      balanceAfter: invoice.total - totalPaid,
    };
    
    setPayments(prev => [...prev, newPayment]);
    
    const newStatus: InvoiceStatus = totalPaid >= invoice.total ? 'PAID' : 'PART_PAID';
    setInvoices(prev => prev.map(inv => 
      inv.id === payment.invoiceId ? { ...inv, status: newStatus } : inv
    ));
    
    const event: TimelineEvent = {
      id: `e${Date.now()}`,
      invoiceId: payment.invoiceId,
      type: 'PAYMENT',
      timestamp: new Date().toISOString(),
      description: `Payment received: $${payment.amount.toFixed(2)}`,
    };
    setTimeline(prev => [...prev, event]);
  };

  const getInvoiceTimeline = (invoiceId: string) => {
    return timeline.filter(e => e.invoiceId === invoiceId).sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  };

  const updateSettings = (updates: Partial<BusinessSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
    
    // Update primary color in CSS
    if (updates.brandColor) {
      document.documentElement.style.setProperty('--primary', updates.brandColor);
    }
  };

  return (
    <AppContext.Provider value={{
      isAuthenticated,
      login,
      logout,
      clients,
      addClient,
      updateClient,
      deleteClient,
      invoices,
      addInvoice,
      updateInvoice,
      sendInvoice,
      signInvoice,
      voidInvoice,
      reviseInvoice,
      payments,
      addPayment,
      timeline,
      getInvoiceTimeline,
      settings,
      updateSettings,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
