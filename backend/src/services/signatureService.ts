import path from "path";
import fs from "fs";
import sharp from "sharp";
import { randomUUID } from "crypto";
import { AppError } from "../utils/errors";
import { signatureDir } from "../utils/storage";

const MAX_SIGNATURE_BYTES = 300 * 1024;

const parseDataUrl = (dataUrl: string) => {
  const match = dataUrl.match(/^data:(image\/png|image\/jpeg);base64,(.+)$/i);
  if (!match) {
    throw new AppError(400, "Invalid signature data URL", "INVALID_SIGNATURE");
  }
  return { mime: match[1], buffer: Buffer.from(match[2], "base64") };
};

const decodeBase64 = (value: string) => {
  try {
    return Buffer.from(value, "base64");
  } catch {
    throw new AppError(400, "Invalid signature image base64", "INVALID_SIGNATURE");
  }
};

const ensureNotBlank = async (buffer: Buffer) => {
  const stats = await sharp(buffer).stats();
  const hasInk = stats.channels.some((channel) => channel.mean > 1);
  if (!hasInk) {
    throw new AppError(400, "Blank signature is not allowed", "INVALID_SIGNATURE");
  }
};

export const normalizeSignature = async (input: {
  signatureDataUrl?: string;
  signatureImageBase64?: string;
  file?: Express.Multer.File;
}) => {
  const hasDataUrl = Boolean(input.signatureDataUrl);
  const hasFile = Boolean(input.file);
  const hasBase64 = Boolean(input.signatureImageBase64);

  if ((hasDataUrl && (hasFile || hasBase64)) || (!hasDataUrl && !(hasFile || hasBase64))) {
    throw new AppError(
      400,
      "Provide exactly one signature input (signatureDataUrl OR signatureFile OR signatureImageBase64)",
      "INVALID_SIGNATURE"
    );
  }

  let buffer: Buffer;
  if (hasDataUrl) {
    buffer = parseDataUrl(input.signatureDataUrl as string).buffer;
  } else if (hasFile) {
    buffer = input.file?.buffer ?? Buffer.alloc(0);
  } else {
    buffer = decodeBase64(input.signatureImageBase64 as string);
  }

  if (buffer.length === 0) {
    throw new AppError(400, "Signature file is empty", "INVALID_SIGNATURE");
  }
  if (buffer.length > MAX_SIGNATURE_BYTES) {
    throw new AppError(400, "Signature exceeds 300KB", "INVALID_SIGNATURE");
  }

  try {
    await ensureNotBlank(buffer);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(400, "Invalid signature image", "INVALID_SIGNATURE");
  }

  let normalized: Buffer;
  try {
    normalized = await sharp(buffer).png({ compressionLevel: 9 }).toBuffer();
  } catch {
    throw new AppError(400, "Invalid signature image", "INVALID_SIGNATURE");
  }
  if (normalized.length > MAX_SIGNATURE_BYTES) {
    throw new AppError(400, "Signature exceeds 300KB after normalization", "INVALID_SIGNATURE");
  }

  const filename = `${Date.now()}-${randomUUID()}.png`;
  const filePath = path.join(signatureDir, filename);
  fs.writeFileSync(filePath, normalized);

  return { filePath };
};
