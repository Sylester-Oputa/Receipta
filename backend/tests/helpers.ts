import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Prisma } from "@prisma/client";
import { prisma } from "../src/db/prisma";

export const createBusinessAndOwner = async (overrides?: {
  allowOverpay?: boolean;
  brandingPrimaryColor?: string;
}) => {
  const business = await prisma.business.create({
    data: {
      name: "Test Business",
      businessCode: "TST",
      brandingPrimaryColor: overrides?.brandingPrimaryColor ?? "#112233",
      allowOverpay: overrides?.allowOverpay ?? false
    }
  });

  const passwordHash = await bcrypt.hash("Password123!", 10);
  const user = await prisma.user.create({
    data: {
      businessId: business.id,
      email: "owner@test.com",
      passwordHash,
      role: "OWNER",
      isActive: true
    }
  });

  const token = jwt.sign(
    { sub: user.id, businessId: business.id, role: user.role },
    process.env.JWT_SECRET ?? "test-secret",
    { expiresIn: "1d" }
  );

  return { business, user, token };
};

export const createClient = async (businessId: string) =>
  prisma.client.create({
    data: {
      businessId,
      name: "Client Co",
      email: "client@example.com"
    }
  });

export const createInvoiceDraft = async (input: {
  businessId: string;
  clientId: string;
  currency?: string;
  taxRate?: number;
}) => {
  const invoice = await prisma.invoice.create({
    data: {
      businessId: input.businessId,
      clientId: input.clientId,
      invoiceNo: "TST-INV-2026-0001",
      version: 1,
      status: "DRAFT",
      issueDate: new Date("2026-01-01"),
      dueDate: new Date("2026-01-15"),
      currency: input.currency ?? "USD",
      notes: "Test invoice",
      taxRate: new Prisma.Decimal(input.taxRate ?? 0),
      subtotal: new Prisma.Decimal(100),
      taxTotal: new Prisma.Decimal(0),
      total: new Prisma.Decimal(100),
      brandColor: "#112233",
      items: {
        create: [
          {
            businessId: input.businessId,
            description: "Item",
            qty: new Prisma.Decimal(1),
            unitPrice: new Prisma.Decimal(100),
            lineTotal: new Prisma.Decimal(100),
            position: 1
          }
        ]
      }
    }
  });

  return invoice;
};
