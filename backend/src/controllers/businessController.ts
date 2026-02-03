import { Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma";
import { AppError } from "../utils/errors";
import { logAuditEvent } from "../services/auditService";

export const getBusiness = async (req: Request, res: Response) => {
  const businessId = req.user?.businessId;
  if (!businessId) {
    throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
  }

  const business = await prisma.business.findFirst({ where: { id: businessId } });
  if (!business) {
    throw new AppError(404, "Business not found", "NOT_FOUND");
  }

  return res.json(business);
};

export const updateBusiness = async (req: Request, res: Response, next: NextFunction) => {
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
        businessCode: data.businessCode as string | undefined,
        address: data.address as string | undefined,
        phone: data.phone as string | undefined,
        email: data.email as string | undefined,
        logoUrl: data.logoUrl as string | undefined,
        bankDetailsJson: data.bankDetailsJson as Record<string, unknown> | undefined,
        brandingPrimaryColor: data.brandingPrimaryColor as string | undefined,
        allowOverpay: data.allowOverpay as boolean | undefined
      }
    });

    await logAuditEvent({
      businessId,
      actorUserId: req.user?.id,
      entityType: "Business",
      entityId: businessId,
      type: "BUSINESS_UPDATED",
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    return res.json(business);
  } catch (error) {
    return next(error);
  }
};
