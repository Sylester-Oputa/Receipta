import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.string().optional(),
  PORT: z.string().optional(),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
  PUBLIC_TOKEN_EXPIRY_DAYS: z.string().optional(),
  STORAGE_DIR: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.string().optional(),
  RATE_LIMIT_MAX: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER: z.string().optional(),
  SEED_BUSINESS_NAME: z.string().optional(),
  SEED_BUSINESS_CODE: z.string().optional(),
  SEED_OWNER_EMAIL: z.string().optional(),
  SEED_OWNER_PASSWORD: z.string().optional(),
  SEED_BRAND_COLOR: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error(
    "Invalid environment variables",
    parsed.error.flatten().fieldErrors,
  );
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  nodeEnv: raw.NODE_ENV ?? "development",
  port: Number(raw.PORT ?? 4000),
  databaseUrl: raw.DATABASE_URL,
  jwtSecret: raw.JWT_SECRET,
  jwtExpiresIn: raw.JWT_EXPIRES_IN ?? "1d",
  corsOrigin: raw.CORS_ORIGIN ?? "*",
  publicTokenExpiryDays: Number(raw.PUBLIC_TOKEN_EXPIRY_DAYS ?? 30),
  storageDir: raw.STORAGE_DIR ?? "storage",
  rateLimitWindowMs: Number(raw.RATE_LIMIT_WINDOW_MS ?? 60_000),
  rateLimitMax: Number(raw.RATE_LIMIT_MAX ?? 60),
  cloudinary: {
    cloudName: raw.CLOUDINARY_CLOUD_NAME,
    apiKey: raw.CLOUDINARY_API_KEY,
    apiSecret: raw.CLOUDINARY_API_SECRET,
    folder: raw.CLOUDINARY_FOLDER ?? "receipta/logos"
  },
  seed: {
    businessName: raw.SEED_BUSINESS_NAME ?? "Receipta Demo Business",
    businessCode: raw.SEED_BUSINESS_CODE ?? "RCP",
    ownerEmail: raw.SEED_OWNER_EMAIL ?? "owner@receipta.local",
    ownerPassword: raw.SEED_OWNER_PASSWORD ?? "ChangeMe123!",
    brandColor: raw.SEED_BRAND_COLOR ?? "#0F766E",
  },
};
