import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../db/prisma";
import { AppError } from "../utils/errors";

export type AuthUser = {
  id: string;
  businessId: string;
  role: string;
};

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(new AppError(401, "Missing authorization token", "UNAUTHORIZED"));
  }

  const token = header.replace("Bearer ", "").trim();
  try {
    const payload = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload & {
      sub: string;
      businessId: string;
      role: string;
    };

    const user = await prisma.user.findFirst({
      where: {
        id: payload.sub,
        businessId: payload.businessId,
        isActive: true
      }
    });

    if (!user) {
      return next(new AppError(403, "User is disabled or not found", "FORBIDDEN"));
    }

    req.user = {
      id: user.id,
      businessId: user.businessId,
      role: user.role
    };

    return next();
  } catch {
    return next(new AppError(401, "Invalid token", "UNAUTHORIZED"));
  }
};
