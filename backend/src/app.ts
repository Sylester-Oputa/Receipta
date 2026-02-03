import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { swaggerSpec } from "./config/swagger";
import { errorHandler, notFound } from "./middleware/error";
import { ensureStorageDirs } from "./utils/storage";
import authRoutes from "./routes/authRoutes";
import businessRoutes from "./routes/businessRoutes";
import clientRoutes from "./routes/clientRoutes";
import invoiceRoutes from "./routes/invoiceRoutes";
import publicRoutes from "./routes/publicRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import receiptRoutes from "./routes/receiptRoutes";
import setupRoutes from "./routes/setupRoutes";

export const createApp = () => {
  const app = express();
  app.set("trust proxy", 1);

  ensureStorageDirs();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin === "*" ? true : env.corsOrigin.split(","),
      credentials: true
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(pinoHttp({ logger: logger as any }));

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use("/api/v1/setup", setupRoutes);

  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/business", businessRoutes);
  app.use("/api/v1/clients", clientRoutes);
  app.use("/api/v1/invoices", invoiceRoutes);
  app.use("/api/v1/public", publicRoutes);
  app.use("/api/v1", paymentRoutes);
  app.use("/api/v1", receiptRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
