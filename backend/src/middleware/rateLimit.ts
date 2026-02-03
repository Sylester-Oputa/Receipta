import rateLimit from "express-rate-limit";
import { env } from "../config/env";

export const publicRateLimit = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        message: "Too many requests",
        code: "RATE_LIMITED",
        details: null
      }
    });
  }
});
