import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8)
});

export const businessUpdateSchema = z
  .object({
    name: z.string().min(1).optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    logoUrl: z
      .preprocess((val) => (val === "" ? null : val), z.string().url().nullable())
      .optional(),
    bankDetailsJson: z.record(z.unknown()).optional(),
    brandingPrimaryColor: z
      .string()
      .regex(/^#([0-9a-fA-F]{6})$/)
      .optional(),
    allowOverpay: z.boolean().optional()
  })
  .strict();

export const clientCreateSchema = z.object({
  name: z.string().min(1),
  contactName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional()
});

export const clientUpdateSchema = clientCreateSchema.partial();

const invoiceItemSchema = z.object({
  description: z.string().min(1),
  qty: z.number().positive(),
  unitPrice: z.number().positive()
});

export const invoiceCreateSchema = z.object({
  clientId: z.string().uuid(),
  invoiceType: z.enum(["PRODUCT", "SERVICE"]).optional(),
  servicePeriod: z.string().min(1).optional(),
  serviceUnit: z.enum(["HOURS", "MONTHS", "SESSIONS", "UNITS"]).optional(),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  currency: z.string().min(1),
  notes: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  items: z.array(invoiceItemSchema).min(1)
});

export const invoiceUpdateSchema = z.object({
  invoiceType: z.enum(["PRODUCT", "SERVICE"]).optional(),
  servicePeriod: z.string().min(1).optional(),
  serviceUnit: z.enum(["HOURS", "MONTHS", "SESSIONS", "UNITS"]).optional(),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  currency: z.string().min(1).optional(),
  notes: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
  items: z.array(invoiceItemSchema).min(1)
});

export const paymentCreateSchema = z.object({
  amount: z.number().positive(),
  method: z.string().min(1),
  paidAt: z.string().optional(),
  note: z.string().optional()
});

export const paymentReversalSchema = z.object({
  amount: z.number().positive(),
  method: z.string().min(1),
  paidAt: z.string().optional(),
  note: z.string().optional()
});

export const publicSignSchema = z.object({
  signerName: z.string().min(1),
  signerEmail: z.string().email(),
  acknowledge: z.boolean(),
  signatureDataUrl: z.string().optional(),
  signatureImageBase64: z.string().optional()
});

export const idParamSchema = z.object({
  id: z.string().uuid()
});

export const tokenParamSchema = z.object({
  token: z.string().min(10)
});

export const setupOwnerSchema = z.object({
  business: z.object({
    name: z.string().min(2),
    businessCode: z.string().regex(/^[A-Z0-9]{3,6}$/),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional()
  }),
  owner: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  }),
  branding: z
    .object({
      primaryColor: z.string().regex(/^#([0-9a-fA-F]{6})$/).optional()
    })
    .optional()
});
