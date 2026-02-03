import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  authApi,
  invoiceApi,
  clientApi,
  paymentApi,
  businessApi,
} from "@/lib/api";
import { toast } from "sonner";
import { formatCurrency } from "@/app/utils/format";
import { ServiceUnit } from "@/app/utils/invoice";

export type InvoiceStatus =
  | "DRAFT"
  | "SENT"
  | "SIGNED"
  | "PART_PAID"
  | "PAID"
  | "VOIDED";

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  contactName?: string;
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
  method: "CASH" | "TRANSFER" | "POS";
  note: string;
  receiptNumber?: string;
  balanceAfter?: number;
  receiptId?: string;
  isReversal?: boolean;
}

export interface Signature {
  signerName: string;
  signerEmail: string;
  signedAt: string;
  signatureData?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  invoiceType: "PRODUCT" | "SERVICE";
  servicePeriod?: string;
  serviceUnit: ServiceUnit;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string;
  viewToken?: string;
  signToken?: string;
  signature?: Signature;
  createdAt: string;
  sentAt?: string;
  version: number;
  currency: string;
}

export interface TimelineEvent {
  id: string;
  invoiceId: string;
  type:
    | "CREATED"
    | "SENT"
    | "VIEWED"
    | "SIGNED"
    | "PAYMENT"
    | "REVISED"
    | "VOIDED";
  timestamp: string;
  description: string;
  metadata?: any;
}

export interface BusinessSettings {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
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
  addClient: (client: Omit<Client, "id">) => Promise<void>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  invoices: Invoice[];
  addInvoice: (
    invoice: Omit<
      Invoice,
      | "id"
      | "invoiceNumber"
      | "viewToken"
      | "signToken"
      | "createdAt"
      | "version"
    >,
  ) => Promise<Invoice | null>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>;
  sendInvoice: (id: string) => Promise<{ viewToken: string; signToken: string } | null>;
  voidInvoice: (id: string) => Promise<void>;
  reviseInvoice: (id: string) => Promise<string | null>;
  refreshInvoice: (id: string) => Promise<void>;

  payments: Payment[];
  addPayment: (payment: Omit<Payment, "id" | "receiptNumber" | "balanceAfter" | "receiptId">) => Promise<void>;

  timeline: TimelineEvent[];
  getInvoiceTimeline: (invoiceId: string) => TimelineEvent[];

  settings: BusinessSettings;
  updateSettings: (settings: Partial<BusinessSettings>) => Promise<void>;
  uploadLogo: (file: File) => Promise<string | null>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const defaultSettings: BusinessSettings = {
  businessName: "",
  address: "",
  phone: "",
  email: "",
  logoUrl: "",
  bankName: "",
  accountName: "",
  accountNumber: "",
  brandColor: "#0F172A",
};

const toNumber = (value: any) => (value == null ? 0 : Number(value));

const mapClient = (client: any): Client => ({
  id: client.id,
  name: client.name ?? "",
  email: client.email ?? "",
  phone: client.phone ?? "",
  address: client.address ?? "",
  contactName: client.contactName ?? undefined,
});

const mapInvoiceItem = (item: any): InvoiceItem => ({
  id: item.id,
  description: item.description ?? "",
  quantity: toNumber(item.qty ?? item.quantity),
  unitPrice: toNumber(item.unitPrice),
  total: toNumber(item.lineTotal ?? item.total),
});

const mapSignature = (signature: any): Signature => ({
  signerName: signature.signerName,
  signerEmail: signature.signerEmail,
  signedAt: signature.signedAt,
});

const mapInvoice = (
  invoice: any,
  tokens?: { viewToken?: string; signToken?: string },
): Invoice => ({
  id: invoice.id,
  invoiceNumber: invoice.invoiceNo ?? invoice.invoiceNumber ?? "",
  clientId: invoice.clientId,
  invoiceType: invoice.invoiceType ?? "PRODUCT",
  servicePeriod: invoice.servicePeriod ?? undefined,
  serviceUnit: (invoice.serviceUnit as ServiceUnit) ?? "UNITS",
  issueDate: invoice.issueDate,
  dueDate: invoice.dueDate ?? "",
  status: invoice.status,
  items: Array.isArray(invoice.items)
    ? invoice.items.map(mapInvoiceItem)
    : [],
  subtotal: toNumber(invoice.subtotal),
  taxRate: toNumber(invoice.taxRate),
  taxAmount: toNumber(invoice.taxTotal ?? invoice.taxAmount),
  total: toNumber(invoice.total),
  notes: invoice.notes ?? "",
  viewToken: tokens?.viewToken,
  signToken: tokens?.signToken,
  signature: invoice.signature ? mapSignature(invoice.signature) : undefined,
  createdAt: invoice.createdAt ?? invoice.issueDate,
  sentAt: invoice.sentAt ?? undefined,
  version: invoice.version ?? 1,
  currency: invoice.currency ?? "NGN",
});

const mapPayment = (payment: any): Payment => ({
  id: payment.id,
  invoiceId: payment.invoiceId,
  amount: toNumber(payment.amount),
  date: payment.paidAt ?? payment.createdAt,
  method: payment.method,
  note: payment.note ?? "",
  receiptNumber: payment.receipt?.receiptNo ?? undefined,
  balanceAfter: payment.receipt ? toNumber(payment.receipt.balanceAfter) : undefined,
  receiptId: payment.receipt?.id ?? undefined,
  isReversal: payment.isReversal ?? false,
});

const mapBusinessSettings = (business: any): BusinessSettings => {
  const bankDetails = (business.bankDetailsJson ?? {}) as Record<string, any>;
  return {
    businessName: business.name ?? "",
    address: business.address ?? "",
    phone: business.phone ?? "",
    email: business.email ?? "",
    logoUrl: business.logoUrl ?? "",
    bankName: bankDetails.bankName ?? "",
    accountName: bankDetails.accountName ?? "",
    accountNumber: bankDetails.accountNumber ?? "",
    brandColor: business.brandingPrimaryColor ?? "#0F172A",
  };
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [settings, setSettings] = useState<BusinessSettings>(defaultSettings);
  const [linkTokens, setLinkTokens] = useState<
    Record<string, { viewToken: string; signToken: string }>
  >({});

  const tokenLookup = useMemo(() => {
    const lookup: Record<string, { viewToken?: string; signToken?: string }> = {};
    invoices.forEach((invoice) => {
      if (invoice.viewToken && invoice.signToken) {
        lookup[invoice.id] = {
          viewToken: invoice.viewToken,
          signToken: invoice.signToken,
        };
      }
    });
    return lookup;
  }, [invoices]);

  const pushTimelineEvent = (event: Omit<TimelineEvent, "id">) => {
    setTimeline((prev) => [
      ...prev,
      { id: `e${Date.now()}`, ...event },
    ]);
  };

  const loadPaymentsForInvoices = async (invoiceIds: string[]) => {
    if (invoiceIds.length === 0) {
      setPayments([]);
      return;
    }

    const results = await Promise.allSettled(
      invoiceIds.map((id) => paymentApi.getByInvoice(id)),
    );
    const allPayments: Payment[] = [];

    results.forEach((result) => {
      if (result.status === "fulfilled") {
        const mapped = Array.isArray(result.value.data)
          ? result.value.data.map(mapPayment)
          : [];
        allPayments.push(...mapped);
      }
    });

    setPayments(allPayments);
  };

  const loadInitialData = async () => {
    try {
      const [businessRes, clientsRes, invoicesRes] = await Promise.all([
        businessApi.getCurrent(),
        clientApi.getAll(),
        invoiceApi.getAll(),
      ]);

      setSettings(mapBusinessSettings(businessRes.data));
      setClients(
        Array.isArray(clientsRes.data)
          ? clientsRes.data.map(mapClient)
          : [],
      );

      setInvoices((prev) => {
        const tokens = new Map(
          prev.map((inv) => [
            inv.id,
            { viewToken: inv.viewToken, signToken: inv.signToken },
          ]),
        );
        return Array.isArray(invoicesRes.data)
          ? invoicesRes.data.map((inv) => mapInvoice(inv, tokens.get(inv.id)))
          : [];
      });

      const invoiceIds = Array.isArray(invoicesRes.data)
        ? invoicesRes.data.map((inv: any) => inv.id)
        : [];
      await loadPaymentsForInvoices(invoiceIds);
    } catch (error) {
      toast.error("Failed to load data");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      return;
    }

    authApi
      .me()
      .then(() => {
        setIsAuthenticated(true);
        loadInitialData();
      })
      .catch(() => {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        setIsAuthenticated(false);
      });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      setClients([]);
      setInvoices([]);
      setPayments([]);
      setTimeline([]);
      setSettings(defaultSettings);
      setLinkTokens({});
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (settings.brandColor) {
      document.documentElement.style.setProperty("--primary", settings.brandColor);
    }
  }, [settings.brandColor]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authApi.login(email, password);
      const { token, user } = response.data;

      localStorage.setItem("auth_token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setIsAuthenticated(true);
      await loadInitialData();
      toast.success("Logged in successfully");
      return true;
    } catch (error: any) {
      const errorData = error.response?.data;
      const errorMessage =
        errorData?.error?.message || errorData?.message || "Login failed";
      toast.error(errorMessage);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    toast.success("Logged out successfully");
  };

  const addClient = async (client: Omit<Client, "id">) => {
    try {
      const response = await clientApi.create({
        name: client.name,
        email: client.email || undefined,
        phone: client.phone || undefined,
        address: client.address || undefined,
        contactName: client.contactName || undefined,
      });
      const mapped = mapClient(response.data);
      setClients((prev) => [...prev, mapped]);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Failed to add client");
      throw error;
    }
  };

  const updateClient = async (id: string, updates: Partial<Client>) => {
    try {
      const response = await clientApi.update(id, {
        name: updates.name,
        email: updates.email || undefined,
        phone: updates.phone || undefined,
        address: updates.address || undefined,
        contactName: updates.contactName || undefined,
      });
      const mapped = mapClient(response.data);
      setClients((prev) => prev.map((c) => (c.id === id ? mapped : c)));
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message || "Failed to update client",
      );
      throw error;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      await clientApi.archive(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message || "Failed to delete client",
      );
      throw error;
    }
  };

  const addInvoice = async (
    invoice: Omit<
      Invoice,
      | "id"
      | "invoiceNumber"
      | "viewToken"
      | "signToken"
      | "createdAt"
      | "version"
    >,
  ): Promise<Invoice | null> => {
    try {
      const payload = {
        clientId: invoice.clientId,
        invoiceType: invoice.invoiceType,
        servicePeriod: invoice.servicePeriod || undefined,
        serviceUnit: invoice.serviceUnit,
        issueDate: invoice.issueDate || undefined,
        dueDate: invoice.dueDate || undefined,
        currency: invoice.currency || "NGN",
        notes: invoice.notes || undefined,
        taxRate: invoice.taxRate ?? 0,
        items: invoice.items.map((item) => ({
          description: item.description,
          qty: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      };

      const response = await invoiceApi.create(payload);
      const mapped = mapInvoice(response.data, tokenLookup[response.data.id]);
      setInvoices((prev) => [mapped, ...prev]);

      pushTimelineEvent({
        invoiceId: mapped.id,
        type: "CREATED",
        timestamp: new Date().toISOString(),
        description: "Invoice created",
      });

      return mapped;
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message || "Failed to create invoice",
      );
      return null;
    }
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    try {
      const payload = {
        invoiceType: updates.invoiceType || undefined,
        servicePeriod: updates.servicePeriod || undefined,
        serviceUnit: updates.serviceUnit || undefined,
        issueDate: updates.issueDate || undefined,
        dueDate: updates.dueDate || undefined,
        currency: updates.currency || "NGN",
        notes: updates.notes || undefined,
        taxRate: updates.taxRate ?? 0,
        items: (updates.items ?? []).map((item) => ({
          description: item.description,
          qty: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      };

      const response = await invoiceApi.update(id, payload);
      const tokens = linkTokens[id] ?? tokenLookup[id];
      const mapped = mapInvoice(response.data, tokens);
      setInvoices((prev) => prev.map((inv) => (inv.id === id ? mapped : inv)));

      pushTimelineEvent({
        invoiceId: id,
        type: "REVISED",
        timestamp: new Date().toISOString(),
        description: "Invoice updated",
      });
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message || "Failed to update invoice",
      );
      throw error;
    }
  };

  const refreshInvoice = useCallback(
    async (id: string) => {
      try {
        const response = await invoiceApi.getById(id);
        setInvoices((prev) => {
          const existing = prev.find((inv) => inv.id === id);
          const tokens = existing
            ? { viewToken: existing.viewToken, signToken: existing.signToken }
            : linkTokens[id];
          const mapped = mapInvoice(response.data, tokens);
          return prev.map((inv) => (inv.id === id ? mapped : inv));
        });

        if (response.data.client) {
          const client = mapClient(response.data.client);
          setClients((prev) => {
            const exists = prev.some((c) => c.id === client.id);
            if (exists) {
              return prev.map((c) => (c.id === client.id ? client : c));
            }
            return [...prev, client];
          });
        }
      } catch {
        // Best-effort refresh; errors handled elsewhere
      }
    },
    [linkTokens],
  );

  const sendInvoice = async (id: string) => {
    try {
      const response = await invoiceApi.send(id);
      const tokens = response.data.tokens as {
        viewToken: string;
        signToken: string;
      };

      setLinkTokens((prev) => ({ ...prev, [id]: tokens }));
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === id
            ? {
                ...inv,
                status: response.data.invoice.status,
                sentAt: response.data.invoice.sentAt,
                viewToken: tokens.viewToken,
                signToken: tokens.signToken,
              }
            : inv,
        ),
      );

      pushTimelineEvent({
        invoiceId: id,
        type: "SENT",
        timestamp: new Date().toISOString(),
        description: "Invoice sent",
      });

      return tokens;
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message || "Failed to send invoice",
      );
      return null;
    }
  };

  const voidInvoice = async (id: string) => {
    try {
      const response = await invoiceApi.void(id);
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === id ? { ...inv, status: response.data.status } : inv,
        ),
      );

      pushTimelineEvent({
        invoiceId: id,
        type: "VOIDED",
        timestamp: new Date().toISOString(),
        description: "Invoice voided",
      });
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message || "Failed to void invoice",
      );
      throw error;
    }
  };

  const reviseInvoice = async (id: string) => {
    try {
      const response = await invoiceApi.revise(id);
      const mapped = mapInvoice(response.data, tokenLookup[response.data.id]);
      setInvoices((prev) => [mapped, ...prev]);

      pushTimelineEvent({
        invoiceId: mapped.id,
        type: "REVISED",
        timestamp: new Date().toISOString(),
        description: `Revised to ${mapped.invoiceNumber}`,
      });

      return mapped.id;
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message || "Failed to revise invoice",
      );
      return null;
    }
  };

  const addPayment = async (
    payment: Omit<Payment, "id" | "receiptNumber" | "balanceAfter" | "receiptId">,
  ) => {
    try {
      const response = await paymentApi.create(payment.invoiceId, {
        amount: payment.amount,
        method: payment.method,
        paidAt: payment.date,
        note: payment.note || undefined,
      });

      const mapped = mapPayment({
        ...response.data.payment,
        receipt: response.data.receipt,
      });

      setPayments((prev) => [mapped, ...prev]);

      const invoiceRes = await invoiceApi.getById(payment.invoiceId);
      const tokens = linkTokens[payment.invoiceId] ?? tokenLookup[payment.invoiceId];
      const updatedInvoice = mapInvoice(invoiceRes.data, tokens);
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === payment.invoiceId ? updatedInvoice : inv,
        ),
      );

      pushTimelineEvent({
        invoiceId: payment.invoiceId,
        type: "PAYMENT",
        timestamp: new Date().toISOString(),
        description: `Payment received: ${formatCurrency(payment.amount)}`,
      });
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message || "Failed to record payment",
      );
      throw error;
    }
  };

  const getInvoiceTimeline = (invoiceId: string) => {
    return timeline
      .filter((e) => e.invoiceId === invoiceId)
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
  };

  const updateSettings = async (updates: Partial<BusinessSettings>) => {
    try {
      const payload: Record<string, unknown> = {};

      if (updates.businessName !== undefined) payload.name = updates.businessName;
      if (updates.address !== undefined) payload.address = updates.address;
      if (updates.phone !== undefined) payload.phone = updates.phone;
      if (updates.email !== undefined) payload.email = updates.email;
      if (updates.logoUrl !== undefined) payload.logoUrl = updates.logoUrl;
      if (updates.brandColor !== undefined)
        payload.brandingPrimaryColor = updates.brandColor;

      const bankDetails = {
        bankName: updates.bankName ?? settings.bankName,
        accountName: updates.accountName ?? settings.accountName,
        accountNumber: updates.accountNumber ?? settings.accountNumber,
      };
      payload.bankDetailsJson = bankDetails;

      const response = await businessApi.update(payload);
      setSettings(mapBusinessSettings(response.data));
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message || "Failed to update settings",
      );
      throw error;
    }
  };

  const uploadLogo = async (file: File) => {
    try {
      const response = await businessApi.uploadLogo(file);
      const logoUrl = response.data.logoUrl as string;
      setSettings((prev) => ({ ...prev, logoUrl }));
      return logoUrl;
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message || "Failed to upload logo",
      );
      return null;
    }
  };

  return (
    <AppContext.Provider
      value={{
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
        voidInvoice,
        reviseInvoice,
        refreshInvoice,
        payments,
        addPayment,
        timeline,
        getInvoiceTimeline,
        settings,
        updateSettings,
        uploadLogo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
