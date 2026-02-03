import { InvoiceStatus, Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";

export const getPaidSummary = async (invoiceId: string) => {
  const aggregate = await prisma.payment.aggregate({
    where: { invoiceId, isReversal: false },
    _sum: { amount: true }
  });

  const paidTotal = aggregate._sum.amount ?? new Prisma.Decimal(0);
  return { paidTotal };
};

export const deriveStatusFromPaid = (
  currentStatus: InvoiceStatus,
  invoiceTotal: Prisma.Decimal,
  paidTotal: Prisma.Decimal
): InvoiceStatus => {
  if (paidTotal.gt(0) && paidTotal.lt(invoiceTotal)) {
    return InvoiceStatus.PART_PAID;
  }
  if (paidTotal.gte(invoiceTotal)) {
    return InvoiceStatus.PAID;
  }
  return currentStatus;
};

export const calculateBalance = (invoiceTotal: Prisma.Decimal, paidTotal: Prisma.Decimal) =>
  Prisma.Decimal.max(invoiceTotal.minus(paidTotal), new Prisma.Decimal(0)).toDecimalPlaces(2);
