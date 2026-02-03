import { Request, Response, NextFunction } from "express";
import { InvoiceLinkType, InvoiceStatus, Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import { AppError } from "../utils/errors";
import { hashSha256 } from "../utils/crypto";
import { renderInvoicePdf } from "../services/pdfService";
import { normalizeSignature } from "../services/signatureService";
import { signedPdfDir } from "../utils/storage";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { logAuditEvent } from "../services/auditService";

const loadInvoiceByToken = async (token: string, type: InvoiceLinkType) => {
  const tokenHash = hashSha256(token);
  const link = await prisma.invoiceLink.findFirst({
    where: {
      tokenHash,
      type,
      revokedAt: null
    },
    include: {
      invoice: {
        include: { items: true, client: true, business: true, signature: true }
      }
    }
  });

  if (!link) {
    throw new AppError(404, "Invalid token", "NOT_FOUND");
  }

  if (link.expiresAt && link.expiresAt.getTime() < Date.now()) {
    throw new AppError(410, "Token expired", "TOKEN_EXPIRED");
  }

  return link.invoice;
};

export const viewInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await loadInvoiceByToken(req.params.token, InvoiceLinkType.VIEW);

    return res.json({
      id: invoice.id,
      invoiceNo: invoice.invoiceNo,
      status: invoice.status,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      currency: invoice.currency,
      notes: invoice.notes,
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxTotal: invoice.taxTotal,
      total: invoice.total,
      brandColor: invoice.brandColor,
      business: {
        name: invoice.business.name,
        address: invoice.business.address,
        phone: invoice.business.phone,
        email: invoice.business.email,
        logoUrl: invoice.business.logoUrl
      },
      client: {
        name: invoice.client.name,
        contactName: invoice.client.contactName,
        email: invoice.client.email,
        phone: invoice.client.phone,
        address: invoice.client.address
      },
      items: invoice.items
    });
  } catch (error) {
    return next(error);
  }
};

export const getInvoicePdfPublic = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signed = req.query.signed === "true";
    const invoice = await loadInvoiceByToken(req.params.token, InvoiceLinkType.VIEW);

    if (signed) {
      if (!invoice.signature) {
        throw new AppError(404, "Signed PDF not available", "NOT_FOUND");
      }
      if (!fs.existsSync(invoice.signature.signedPdfPath)) {
        throw new AppError(404, "Signed PDF not available", "NOT_FOUND");
      }
      const buffer = fs.readFileSync(invoice.signature.signedPdfPath);
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

export const signInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await loadInvoiceByToken(req.params.token, InvoiceLinkType.SIGN);

    if (invoice.signature) {
      throw new AppError(409, "Invoice already signed", "ALREADY_SIGNED");
    }
    if (invoice.status === InvoiceStatus.VOIDED) {
      throw new AppError(409, "Cannot sign a voided invoice", "INVOICE_LOCKED");
    }
    if (invoice.status === InvoiceStatus.DRAFT) {
      throw new AppError(409, "Invoice must be sent before signing", "INVOICE_LOCKED");
    }

    const { signerName, signerEmail, acknowledge, signatureDataUrl, signatureImageBase64 } =
      req.body as {
        signerName: string;
        signerEmail: string;
        acknowledge: boolean | string;
        signatureDataUrl?: string;
        signatureImageBase64?: string;
      };

    const acknowledged = acknowledge === true || acknowledge === "true";
    if (!signerName || !signerEmail || !acknowledged) {
      throw new AppError(400, "Signer name, email, and acknowledge=true are required", "VALIDATION_ERROR");
    }

    const normalized = await normalizeSignature({
      signatureDataUrl,
      signatureImageBase64,
      file: req.file
    });

    const signedAt = new Date();
    const pdfBuffer = await renderInvoicePdf({
      business: invoice.business,
      client: invoice.client,
      invoice,
      items: invoice.items,
      signaturePath: normalized.filePath,
      signerName,
      signerEmail,
      signedAt
    });

    const signedPdfPath = path.join(signedPdfDir, `${invoice.id}-${randomUUID()}.pdf`);
    fs.writeFileSync(signedPdfPath, pdfBuffer);

    const documentHash = hashSha256(pdfBuffer);

    const saved = await prisma
      .$transaction(async (tx) => {
        const signature = await tx.invoiceSignature.create({
          data: {
            businessId: invoice.businessId,
            invoiceId: invoice.id,
            signerName,
            signerEmail,
            signatureFilePath: normalized.filePath,
            signedAt,
            ipAddress: req.ip,
            userAgent: req.get("user-agent") ?? "",
            documentHash,
            signedPdfPath
          }
        });

        const updatedInvoice = await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            status: InvoiceStatus.SIGNED,
            signedAt,
            lockedAt: signedAt
          }
        });

        await tx.invoiceLink.updateMany({
          where: { invoiceId: invoice.id, type: "SIGN", revokedAt: null },
          data: { revokedAt: signedAt }
        });

        return { signature, updatedInvoice };
      })
      .catch((error) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          throw new AppError(409, "Invoice already signed", "ALREADY_SIGNED");
        }
        throw error;
      });

    await logAuditEvent({
      businessId: invoice.businessId,
      entityType: "Invoice",
      entityId: invoice.id,
      type: "INVOICE_SIGNED",
      metaJson: { signerName, signerEmail },
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    return res.json({
      invoice: saved.updatedInvoice,
      signature: saved.signature
    });
  } catch (error) {
    return next(error);
  }
};
