import { Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma";

export const requireSetupComplete = async (req: Request, res: Response, next: NextFunction) => {
  const path = req.path;
  if (path.startsWith("/docs") || path.startsWith("/api/v1/setup")) {
    return next();
  }

  const [businessCount, userCount] = await Promise.all([
    prisma.business.count(),
    prisma.user.count()
  ]);

  if (businessCount === 0 || userCount === 0) {
    return res.status(503).json({
      error: {
        message: "Setup required",
        code: "SETUP_REQUIRED",
        details: null
      }
    });
  }

  return next();
};
