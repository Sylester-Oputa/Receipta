import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { prisma } from "../db/prisma";
import { env } from "../config/env";
import { AppError } from "../utils/errors";
import { logAuditEvent } from "../services/auditService";

const signToken = (payload: {
  sub: string;
  businessId: string;
  role: string;
}) =>
  jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as SignOptions);

const isSetupComplete = async () => {
  const [businessCount, userCount] = await Promise.all([
    prisma.business.count(),
    prisma.user.count(),
  ]);
  return businessCount > 0 && userCount > 0;
};

export const getSetupStatus = async (_req: Request, res: Response) => {
  const complete = await isSetupComplete();
  return res.json({ isSetupComplete: complete });
};

export const createOwner = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const [businessCount, userCount] = await Promise.all([
      prisma.business.count(),
      prisma.user.count(),
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

    // Check for duplicate business name
    const existingBusinessName = await prisma.business.findFirst({
      where: { name: business.name.trim() },
    });
    if (existingBusinessName) {
      throw new AppError(
        409,
        `A business with the name '${business.name.trim()}' already exists`,
        "BUSINESS_NAME_EXISTS",
      );
    }

    // Check for duplicate business email
    if (business.email) {
      const existingBusinessEmail = await prisma.business.findFirst({
        where: { email: business.email.toLowerCase() },
      });
      if (existingBusinessEmail) {
        throw new AppError(
          409,
          `The business email '${business.email}' is already registered`,
          "BUSINESS_EMAIL_EXISTS",
        );
      }
    }

    // Check for duplicate business phone
    if (business.phone) {
      const existingBusinessPhone = await prisma.business.findFirst({
        where: { phone: business.phone },
      });
      if (existingBusinessPhone) {
        throw new AppError(
          409,
          `The phone number '${business.phone}' is already registered`,
          "BUSINESS_PHONE_EXISTS",
        );
      }
    }

    const ownerEmail = owner.email.trim().toLowerCase();

    // Check for duplicate owner email
    const existingOwnerEmail = await prisma.user.findFirst({
      where: { email: ownerEmail },
    });
    if (existingOwnerEmail) {
      throw new AppError(
        409,
        `The owner email '${owner.email}' is already registered`,
        "OWNER_EMAIL_EXISTS",
      );
    }

    // Generate unique sequential business code
    let code = business.businessCode.trim().toUpperCase();
    let codeExists = await prisma.business.findFirst({
      where: { businessCode: code },
    });
    let counter = 1;

    while (codeExists) {
      code = `${business.businessCode.trim().toUpperCase()}${counter}`;
      codeExists = await prisma.business.findFirst({
        where: { businessCode: code },
      });
      counter++;
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
          allowOverpay: false,
        },
      });

      const createdUser = await tx.user.create({
        data: {
          businessId: createdBusiness.id,
          email: ownerEmail,
          passwordHash,
          role: "OWNER",
          isActive: true,
        },
      });

      return { business: createdBusiness, user: createdUser };
    });

    const token = signToken({
      sub: created.user.id,
      businessId: created.business.id,
      role: created.user.role,
    });

    await logAuditEvent({
      businessId: created.business.id,
      actorUserId: created.user.id,
      entityType: "Business",
      entityId: created.business.id,
      type: "BUSINESS_CREATED",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    await logAuditEvent({
      businessId: created.business.id,
      actorUserId: created.user.id,
      entityType: "User",
      entityId: created.user.id,
      type: "OWNER_CREATED",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.status(201).json({
      token,
      user: {
        id: created.user.id,
        email: created.user.email,
        role: created.user.role,
      },
      business: {
        id: created.business.id,
        businessCode: created.business.businessCode,
        brandingPrimaryColor: created.business.brandingPrimaryColor,
      },
    });
  } catch (error) {
    return next(error);
  }
};
