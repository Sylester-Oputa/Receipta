import { Request, Response, NextFunction } from "express";
import { InvoiceStatus, Prisma, SequenceKey } from "@prisma/client";
import { prisma } from "../db/prisma";
import { AppError } from "../utils/errors";
import { calculateTotals } from "../utils/invoiceTotals";
import { formatInvoiceNo, getNextSequenceWithTx } from "../services/sequenceService";
import { generateToken, hashSha256 } from "../utils/crypto";
import { env } from "../config/env";
import { renderInvoicePdf } from "../services/pdfService";
import fs from "fs";
import { logAuditEvent } from "../services/auditService";
import { deriveStatusFromPaid, getPaidSummary } from "../services/invoiceService";

const parseDate = (value?: string) => (value ? new Date(value) : undefined);

const ensureDraft = (status: InvoiceStatus) => {
  if (status !== InvoiceStatus.DRAFT) {
    throw new AppError(409, "Invoice is not editable", "INVOICE_LOCKED");
  }
};

export const createInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) {
      throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
    }

    const business = await prisma.business.findFirst({ where: { id: businessId } });
    if (!business) {
      throw new AppError(404, "Business not found", "NOT_FOUND");
    }

    const client = await prisma.client.findFirst({
      where: { id: req.body.clientId, businessId }
    });
    if (!client) {
      throw new AppError(404, "Client not found", "NOT_FOUND");
    }

    const itemsInput = req.body.items as Array<{ description: string; qty: number; unitPrice: number }>;
    if (!itemsInput || itemsInput.length === 0) {
      throw new AppError(400, "Invoice requires at least one item", "VALIDATION_ERROR");
    }
    if (!itemsInput || itemsInput.length === 0) {
      throw new AppError(400, "Invoice requires at least one item", "VALIDATION_ERROR");
    }

    const taxRate = Number(req.body.taxRate ?? 0);
    const currency = req.body.currency as string;

    const itemsWithPosition = itemsInput.map((item, index) => ({
      ...item,
      position: index + 1
    }));

    const { items, subtotal, taxTotal, total } = calculateTotals(itemsWithPosition, taxRate);
    const issueDate = parseDate(req.body.issueDate) ?? new Date();
    const dueDate = parseDate(req.body.dueDate);

    const invoice = await prisma.$transaction(async (tx) => {
      const year = issueDate.getUTCFullYear();
      const seq = await getNextSequenceWithTx(tx, businessId, SequenceKey.INVOICE, year);
      const invoiceNo = formatInvoiceNo(business.businessCode, year, seq);

      return tx.invoice.create({
        data: {
          businessId,
          clientId: client.id,
          invoiceNo,
          version: 1,
          status: InvoiceStatus.DRAFT,
          issueDate,
          dueDate,
          currency,
          notes: req.body.notes,
          taxRate: new Prisma.Decimal(taxRate),
          subtotal,
          taxTotal,
          total,
          brandColor: business.brandingPrimaryColor,
          items: {
            create: items.map((item) => ({
              businessId,
              description: item.description,
              qty: item.qty,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
              position: item.position
            }))
          }
        },
        include: { items: true }
      });
    });

    await logAuditEvent({
      businessId,
      actorUserId: req.user?.id,
      entityType: "Invoice",
      entityId: invoice.id,
      type: "INVOICE_CREATED",
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    return res.status(201).json(invoice);
  } catch (error) {
    return next(error);
  }
};

export const listInvoices = async (req: Request, res: Response) => {
  const businessId = req.user?.businessId;
  if (!businessId) {
    throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
  }

  const statusParam = req.query.status as string | undefined;
  const status = statusParam && Object.values(InvoiceStatus).includes(statusParam as InvoiceStatus)
    ? (statusParam as InvoiceStatus)
    : undefined;
  const invoices = await prisma.invoice.findMany({
    where: {
      businessId,
      ...(status ? { status } : {})
    },
    include: { client: true, items: true, signature: true },
    orderBy: { createdAt: "desc" }
  });

  return res.json(invoices);
};

export const getInvoice = async (req: Request, res: Response) => {
  const businessId = req.user?.businessId;
  if (!businessId) {
    throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: req.params.id, businessId },
    include: {
      client: true,
      items: true,
      signature: true,
      payments: true,
      links: true
    }
  });

  if (!invoice) {
    throw new AppError(404, "Invoice not found", "NOT_FOUND");
  }

  return res.json(invoice);
};

export const updateInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) {
      throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, businessId },
      include: { items: true }
    });
    if (!invoice) {
      throw new AppError(404, "Invoice not found", "NOT_FOUND");
    }

    ensureDraft(invoice.status);

    const itemsInput = req.body.items as Array<{ description: string; qty: number; unitPrice: number }>;
    const taxRate = Number(req.body.taxRate ?? invoice.taxRate);

    const itemsWithPosition = itemsInput.map((item, index) => ({
      ...item,
      position: index + 1
    }));

    const { items, subtotal, taxTotal, total } = calculateTotals(itemsWithPosition, taxRate);
    const issueDate = parseDate(req.body.issueDate) ?? invoice.issueDate;
    const dueDate = parseDate(req.body.dueDate) ?? invoice.dueDate;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: invoice.id } });

      return tx.invoice.update({
        where: { id: invoice.id },
        data: {
          issueDate,
          dueDate,
          currency: req.body.currency ?? invoice.currency,
          notes: req.body.notes ?? invoice.notes,
          taxRate: new Prisma.Decimal(taxRate),
          subtotal,
          taxTotal,
          total,
          items: {
            create: items.map((item) => ({
              businessId,
              description: item.description,
              qty: item.qty,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
              position: item.position
            }))
          }
        },
        include: { items: true }
      });
    });

    await logAuditEvent({
      businessId,
      actorUserId: req.user?.id,
      entityType: "Invoice",
      entityId: invoice.id,
      type: "INVOICE_UPDATED",
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    return res.json(updated);
  } catch (error) {
    return next(error);
  }
};

export const sendInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) {
      throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, businessId }
    });
    if (!invoice) {
      throw new AppError(404, "Invoice not found", "NOT_FOUND");
    }

    ensureDraft(invoice.status);

    const now = new Date();
    const viewToken = generateToken();
    const signToken = generateToken();
    const expiresAt = new Date(now.getTime() + env.publicTokenExpiryDays * 24 * 60 * 60 * 1000);

    const updated = await prisma.$transaction(async (tx) => {
      await tx.invoiceLink.updateMany({
        where: { invoiceId: invoice.id, revokedAt: null },
        data: { revokedAt: now }
      });

      await tx.invoiceLink.createMany({
        data: [
          {
            businessId,
            invoiceId: invoice.id,
            type: "VIEW",
            tokenHash: hashSha256(viewToken),
            expiresAt
          },
          {
            businessId,
            invoiceId: invoice.id,
            type: "SIGN",
            tokenHash: hashSha256(signToken),
            expiresAt
          }
        ]
      });

      return tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: InvoiceStatus.SENT,
          sentAt: now
        }
      });
    });

    await logAuditEvent({
      businessId,
      actorUserId: req.user?.id,
      entityType: "Invoice",
      entityId: invoice.id,
      type: "INVOICE_SENT",
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    return res.json({
      invoice: updated,
      tokens: {
        viewToken,
        signToken,
        expiresAt
      }
    });
  } catch (error) {
    return next(error);
  }
};

export const reviseInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) {
      throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, businessId },
      include: { items: true, client: true }
    });
    if (!invoice) {
      throw new AppError(404, "Invoice not found", "NOT_FOUND");
    }

    if (invoice.status === InvoiceStatus.DRAFT) {
      throw new AppError(400, "Invoice is still editable", "REVISION_NOT_ALLOWED");
    }

    const business = await prisma.business.findFirst({ where: { id: businessId } });
    if (!business) {
      throw new AppError(404, "Business not found", "NOT_FOUND");
    }

    const issueDate = new Date();
    const year = issueDate.getUTCFullYear();

    const revision = await prisma.$transaction(async (tx) => {
      const seq = await getNextSequenceWithTx(tx, businessId, SequenceKey.INVOICE, year);
      const invoiceNo = formatInvoiceNo(business.businessCode, year, seq);

      const created = await tx.invoice.create({
        data: {
          businessId,
          clientId: invoice.clientId,
          originalInvoiceId: invoice.originalInvoiceId ?? invoice.id,
          invoiceNo,
          version: invoice.version + 1,
          status: InvoiceStatus.DRAFT,
          issueDate,
          dueDate: invoice.dueDate,
          currency: invoice.currency,
          notes: invoice.notes,
          taxRate: invoice.taxRate,
          subtotal: invoice.subtotal,
          taxTotal: invoice.taxTotal,
          total: invoice.total,
          brandColor: invoice.brandColor,
          items: {
            create: invoice.items.map((item) => ({
              businessId,
              description: item.description,
              qty: item.qty,
              unitPrice: item.unitPrice,
              lineTotal: item.lineTotal,
              position: item.position
            }))
          }
        },
        include: { items: true }
      });

      return created;
    });

    await logAuditEvent({
      businessId,
      actorUserId: req.user?.id,
      entityType: "Invoice",
      entityId: revision.id,
      type: "INVOICE_REVISED",
      metaJson: { originalInvoiceId: invoice.id },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    return res.status(201).json(revision);
  } catch (error) {
    return next(error);
  }
};

export const voidInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) {
      throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, businessId },
      include: { payments: true, signature: true }
    });
    if (!invoice) {
      throw new AppError(404, "Invoice not found", "NOT_FOUND");
    }

    if (invoice.signature || invoice.status === InvoiceStatus.SIGNED) {
      throw new AppError(409, "Signed invoices cannot be voided", "INVOICE_LOCKED");
    }

    if (invoice.payments.length > 0) {
      throw new AppError(409, "Invoices with payments cannot be voided", "INVOICE_LOCKED");
    }

    const updated = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: InvoiceStatus.VOIDED,
        voidedAt: new Date()
      }
    });

    await logAuditEvent({
      businessId,
      actorUserId: req.user?.id,
      entityType: "Invoice",
      entityId: invoice.id,
      type: "INVOICE_VOIDED",
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    return res.json(updated);
  } catch (error) {
    return next(error);
  }
};

export const getInvoicePdf = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) {
      throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
    }

    const signed = req.query.signed === "true";
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, businessId },
      include: { items: true, client: true, business: true, signature: true }
    });

    if (!invoice) {
      throw new AppError(404, "Invoice not found", "NOT_FOUND");
    }

    if (signed) {
      if (!invoice.signature) {
        throw new AppError(404, "Signed PDF not available", "NOT_FOUND");
      }
      const pdfPath = invoice.signature.signedPdfPath;
      if (!fs.existsSync(pdfPath)) {
        throw new AppError(404, "Signed PDF not available", "NOT_FOUND");
      }
      const buffer = fs.readFileSync(pdfPath);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename=invoice-${invoice.invoiceNo}-signed.pdf`);
      return res.send(buffer);
    }

    const buffer = await renderInvoicePdf({
      business: invoice.business,
      client: invoice.client,
      invoice,
      items: invoice.items
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=invoice-${invoice.invoiceNo}.pdf`);
    return res.send(buffer);
  } catch (error) {
    return next(error);
  }
};

export const refreshDerivedStatus = async (invoiceId: string) => {
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId } });
  if (!invoice) return;
  const { paidTotal } = await getPaidSummary(invoiceId);
  const nextStatus = deriveStatusFromPaid(invoice.status, invoice.total, paidTotal);
  if (nextStatus !== invoice.status) {
    await prisma.invoice.update({ where: { id: invoiceId }, data: { status: nextStatus } });
  }
};
