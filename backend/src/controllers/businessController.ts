import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import { AppError } from "../utils/errors";
import { logAuditEvent } from "../services/auditService";
import { uploadLogoToCloudinary } from "../services/cloudinaryService";

export const getBusiness = async (req: Request, res: Response) => {
  const businessId = req.user?.businessId;
  if (!businessId) {
    throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
  }

  const business = await prisma.business.findFirst({
    where: { id: businessId },
  });
  if (!business) {
    throw new AppError(404, "Business not found", "NOT_FOUND");
  }

  return res.json(business);
};

export const updateBusiness = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) {
      throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
    }

    const data = req.body as Record<string, unknown>;

    const business = await prisma.business.update({
      where: { id: businessId },
      data: {
        name: data.name as string | undefined,
        address: data.address as string | undefined,
        phone: data.phone as string | undefined,
        email: data.email as string | undefined,
        logoUrl:
          data.logoUrl === null
            ? null
            : (data.logoUrl as string | undefined),
        bankDetailsJson: data.bankDetailsJson as
          | Prisma.InputJsonValue
          | undefined,
        brandingPrimaryColor: data.brandingPrimaryColor as string | undefined,
        allowOverpay: data.allowOverpay as boolean | undefined,
      },
    });

    await logAuditEvent({
      businessId,
      actorUserId: req.user?.id,
      entityType: "Business",
      entityId: businessId,
      type: "BUSINESS_UPDATED",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.json(business);
  } catch (error) {
    return next(error);
  }
};

export const uploadLogo = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const businessId = req.user?.businessId;
    if (!businessId) {
      throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
    }

    if (!req.file) {
      throw new AppError(400, "Logo file is required", "INVALID_LOGO");
    }

    const logoUrl = await uploadLogoToCloudinary(
      req.file.buffer,
      req.file.originalname,
    );

    const business = await prisma.business.update({
      where: { id: businessId },
      data: { logoUrl },
    });

    await logAuditEvent({
      businessId,
      actorUserId: req.user?.id,
      entityType: "Business",
      entityId: businessId,
      type: "BUSINESS_LOGO_UPDATED",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.json({ logoUrl: business.logoUrl });
  } catch (error) {
    return next(error);
  }
};
