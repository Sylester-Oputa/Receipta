import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env";
import { AppError } from "../utils/errors";

type CloudinaryUploadResult = {
  secure_url?: string;
};

type CloudinaryUploadError = Error | { message?: string } | null | undefined;

let configured = false;

const ensureCloudinaryConfigured = () => {
  if (configured) return;
  if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) {
    throw new AppError(500, "Cloudinary is not configured", "CLOUDINARY_NOT_CONFIGURED");
  }
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret
  });
  configured = true;
};

export const uploadLogoToCloudinary = async (fileBuffer: Buffer, filename: string) => {
  ensureCloudinaryConfigured();

  return new Promise<string>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: env.cloudinary.folder,
        resource_type: "image",
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        filename_override: filename
      },
      (error: CloudinaryUploadError, result?: CloudinaryUploadResult) => {
        if (error || !result?.secure_url) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(fileBuffer);
  });
};
