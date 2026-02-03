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

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: "insensitive",
        },
      },
    });

    if (!user) {
      throw new AppError(401, "Invalid credentials", "UNAUTHORIZED");
    }
    if (!user.isActive) {
      throw new AppError(403, "User is disabled", "FORBIDDEN");
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      throw new AppError(401, "Invalid credentials", "UNAUTHORIZED");
    }

    const token = signToken({
      sub: user.id,
      businessId: user.businessId,
      role: user.role,
    });

    await logAuditEvent({
      businessId: user.businessId,
      actorUserId: user.id,
      entityType: "User",
      entityId: user.id,
      type: "LOGIN",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        businessId: user.businessId,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const me = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
  }

  const user = await prisma.user.findFirst({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, "User not found", "NOT_FOUND");
  }

  return res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    businessId: user.businessId,
    isActive: user.isActive,
  });
};

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, "Unauthorized", "UNAUTHORIZED");
    }

    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    const user = await prisma.user.findFirst({ where: { id: userId } });
    if (!user) {
      throw new AppError(404, "User not found", "NOT_FOUND");
    }

    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) {
      throw new AppError(
        400,
        "Current password is incorrect",
        "INVALID_PASSWORD",
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await logAuditEvent({
      businessId: user.businessId,
      actorUserId: user.id,
      entityType: "User",
      entityId: user.id,
      type: "PASSWORD_CHANGED",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.json({ message: "Password updated" });
  } catch (error) {
    return next(error);
  }
};
