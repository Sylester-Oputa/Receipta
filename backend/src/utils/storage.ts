import fs from "fs";
import path from "path";
import { env } from "../config/env";

export const storageRoot = path.resolve(process.cwd(), env.storageDir);
export const signatureDir = path.join(storageRoot, "signatures");
export const pdfDir = path.join(storageRoot, "pdfs");
export const signedPdfDir = path.join(pdfDir, "signed");
export const receiptPdfDir = path.join(pdfDir, "receipts");

export const ensureStorageDirs = () => {
  [storageRoot, signatureDir, signedPdfDir, receiptPdfDir].forEach((dir) => {
    fs.mkdirSync(dir, { recursive: true });
  });
};
