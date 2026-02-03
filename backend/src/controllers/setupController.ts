import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db/prisma";
import { env } from "../config/env";
import { AppError } from "../utils/errors";
import { logAuditEvent } from "../services/auditService";

const signToken = (payload: { sub: string; businessId: string; role: string }) =>
  jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

const isSetupComplete = async () => {
  const [businessCount, userCount] = await Promise.all([
    prisma.business.count(),
    prisma.user.count()
  ]);
  return businessCount > 0 && userCount > 0;
};

export const getSetupStatus = async (_req: Request, res: Response) => {
  const complete = await isSetupComplete();
  return res.json({ isSetupComplete: complete });
};

export const createOwner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [businessCount, userCount] = await Promise.all([
      prisma.business.count(),
      prisma.user.count()
    ]);
    if (businessCount > 0 || userCount > 0) {
      throw new AppError(409, "Setup already completed", "SETUP_ALREADY_DONE");
    }

    const { business, owner, branding } = req.body as {
      business: {
        name: string;
        businessCode: string;
        email?: string;
        phone?: string;
        address?: string;
      };
      owner: {
        email: string;
        password: string;
      };
      branding?: {
        primaryColor?: string;
      };
    };

    const code = business.businessCode.trim();
    const existing = await prisma.business.findFirst({ where: { businessCode: code } });
    if (existing) {
      throw new AppError(409, "Business code already exists", "BUSINESS_CODE_EXISTS");
    }

    const passwordHash = await bcrypt.hash(owner.password, 10);

    const created = await prisma.$transaction(async (tx) => {
      const createdBusiness = await tx.business.create({
        data: {
          name: business.name.trim(),
          businessCode: code,
          email: business.email,
          phone: business.phone,
          address: business.address,
          brandingPrimaryColor: branding?.primaryColor ?? "#0F172A",
          allowOverpay: false
        }
      });

      const createdUser = await tx.user.create({
        data: {
          businessId: createdBusiness.id,
          email: owner.email.toLowerCase(),
          passwordHash,
          role: "OWNER",
          isActive: true
        }
      });

      return { business: createdBusiness, user: createdUser };
    });

    const token = signToken({
      sub: created.user.id,
      businessId: created.business.id,
      role: created.user.role
    });

    await logAuditEvent({
      businessId: created.business.id,
      actorUserId: created.user.id,
      entityType: "Business",
      entityId: created.business.id,
      type: "BUSINESS_CREATED",
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    await logAuditEvent({
      businessId: created.business.id,
      actorUserId: created.user.id,
      entityType: "User",
      entityId: created.user.id,
      type: "OWNER_CREATED",
      ipAddress: req.ip,
      userAgent: req.get("user-agent")
    });

    return res.status(201).json({
      token,
      user: {
        id: created.user.id,
        email: created.user.email,
        role: created.user.role
      },
      business: {
        id: created.business.id,
        businessCode: created.business.businessCode,
        brandingPrimaryColor: created.business.brandingPrimaryColor
      }
    });
  } catch (error) {
    return next(error);
  }
};
