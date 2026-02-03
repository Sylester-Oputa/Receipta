import { Request, Response, NextFunction } from "express";
import { InvoiceStatus, Prisma, SequenceKey } from "@prisma/client";
import { prisma } from "../db/prisma";
import { AppError } from "../utils/errors";
import { formatReceiptNo, getNextSequenceWithTx } from "../services/sequenceService";
import { calculateBalance, deriveStatusFromPaid, getPaidSummary } from "../services/invoiceService";
import { logAuditEvent } from "../services/auditService";

const ensureInvoicePayable = (status: InvoiceStatus) => {
  if (status === InvoiceStatus.VOIDED) {
    throw new AppError(409, "Cannot pay a voided invoice", "INVOICE_LOCKED");
  }
};

export const createPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) {
      throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, businessId },
      include: { business: true }
    });
    if (!invoice) {
      throw new AppError(404, "Invoice not found", "NOT_FOUND");
    }

    ensureInvoicePayable(invoice.status);

    const amount = new Prisma.Decimal(req.body.amount);
    if (amount.lte(0)) {
      throw new AppError(400, "Payment amount must be positive", "VALIDATION_ERROR");
    }

    const { paidTotal } = await getPaidSummary(invoice.id);
    const paidAfter = paidTotal.plus(amount).toDecimalPlaces(2);

    if (!invoice.business.allowOverpay && paidAfter.gt(invoice.total)) {
      throw new AppError(400, "Overpayment is not allowed", "OVERPAYMENT");
    }

    const paidAt = req.body.paidAt ? new Date(req.body.paidAt) : new Date();

    const created = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          businessId,
          invoiceId: invoice.id,
          amount,
          method: req.body.method,
          paidAt,
          note: req.body.note,
          isReversal: false
        }
      });

      const year = paidAt.getUTCFullYear();
      const seq = await getNextSequenceWithTx(tx, businessId, SequenceKey.RECEIPT, year);
      const receiptNo = formatReceiptNo(invoice.business.businessCode, year, seq);
      const balanceAfter = calculateBalance(invoice.total, paidAfter);

      const receipt = await tx.receipt.create({
        data: {
          businessId,
          invoiceId: invoice.id,
          paymentId: payment.id,
          receiptNo,
          amount,
          balanceAfter
        }
      });

      const nextStatus = deriveStatusFromPaid(invoice.status, invoice.total, paidAfter);
      if (nextStatus !== invoice.status) {
        await tx.invoice.update({ where: { id: invoice.id }, data: { status: nextStatus } });
      }

      return { payment, receipt };
    });

    await logAuditEvent({
      businessId,
      actorUserId: req.user?.id,
      entityType: "Payment",
      entityId: created.payment.id,
      type: "PAYMENT_CREATED",
      metaJson: { invoiceId: invoice.id },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    return res.status(201).json(created);
  } catch (error) {
    return next(error);
  }
};

export const createReversal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) {
      throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
    }

    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, businessId },
      include: { business: true }
    });
    if (!invoice) {
      throw new AppError(404, "Invoice not found", "NOT_FOUND");
    }

    ensureInvoicePayable(invoice.status);

    const amount = new Prisma.Decimal(req.body.amount);
    if (amount.lte(0)) {
      throw new AppError(400, "Reversal amount must be positive", "VALIDATION_ERROR");
    }

    const paidAt = req.body.paidAt ? new Date(req.body.paidAt) : new Date();
    const reversalAmount = amount.mul(-1);

    const { paidTotal } = await getPaidSummary(invoice.id);
    const balanceAfter = calculateBalance(invoice.total, paidTotal);

    const created = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          businessId,
          invoiceId: invoice.id,
          amount: reversalAmount,
          method: req.body.method,
          paidAt,
          note: req.body.note,
          isReversal: true
        }
      });

      const year = paidAt.getUTCFullYear();
      const seq = await getNextSequenceWithTx(tx, businessId, SequenceKey.RECEIPT, year);
      const receiptNo = formatReceiptNo(invoice.business.businessCode, year, seq);

      const receipt = await tx.receipt.create({
        data: {
          businessId,
          invoiceId: invoice.id,
          paymentId: payment.id,
          receiptNo,
          amount: reversalAmount,
          balanceAfter
        }
      });

      return { payment, receipt };
    });

    await logAuditEvent({
      businessId,
      actorUserId: req.user?.id,
      entityType: "Payment",
      entityId: created.payment.id,
      type: "PAYMENT_REVERSAL",
      metaJson: { invoiceId: invoice.id },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    return res.status(201).json(created);
  } catch (error) {
    return next(error);
  }
};

export const listPayments = async (req: Request, res: Response) => {
  const businessId = req.user?.businessId;
  if (!businessId) {
    throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
  }

  const payments = await prisma.payment.findMany({
    where: { invoiceId: req.params.id, businessId },
    include: { receipt: true },
    orderBy: { createdAt: "desc" }
  });

  return res.json(payments);
};
