import { Request, Response, NextFunction } from "express";
import { MulterError } from "multer";
import { ZodError } from "zod";
import { logger } from "../config/logger";
import { AppError, isAppError } from "../utils/errors";

export const notFound = (_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(404, "Route not found", "NOT_FOUND"));
};

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        details: err.flatten()
      }
    });
  }

  if (err instanceof MulterError) {
    return res.status(400).json({
      error: {
        message: err.message,
        code: "INVALID_SIGNATURE",
        details: null
      }
    });
  }

  if (isAppError(err)) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
        details: err.details ?? null
      }
    });
  }

  logger.error({ err }, "Unhandled error");
  return res.status(500).json({
    error: {
      message: "Internal server error",
      code: "INTERNAL_ERROR",
      details: null
    }
  });
};
