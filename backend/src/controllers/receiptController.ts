import { Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma";
import { AppError } from "../utils/errors";
import { renderReceiptPdf } from "../services/pdfService";

export const getReceipt = async (req: Request, res: Response) => {
  const businessId = req.user?.businessId;
  if (!businessId) {
    throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
  }

  const receipt = await prisma.receipt.findFirst({
    where: { id: req.params.id, businessId },
    include: { invoice: true, payment: true }
  });

  if (!receipt) {
    throw new AppError(404, "Receipt not found", "NOT_FOUND");
  }

  return res.json(receipt);
};

export const getReceiptPdf = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) {
      throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
    }

    const receipt = await prisma.receipt.findFirst({
      where: { id: req.params.id, businessId },
      include: {
        invoice: {
          include: {
            client: true
          }
        },
        business: true,
        payment: true
      }
    });

    if (!receipt) {
      throw new AppError(404, "Receipt not found", "NOT_FOUND");
    }

    const buffer = await renderReceiptPdf({
      business: receipt.business,
      invoice: receipt.invoice,
      receipt,
      client: receipt.invoice?.client ?? null,
      payment: receipt.payment ?? null
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename=receipt-${receipt.receiptNo}.pdf`);
    return res.send(buffer);
  } catch (error) {
    return next(error);
  }
};
