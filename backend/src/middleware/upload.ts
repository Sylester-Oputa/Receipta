import multer from "multer";
import { AppError } from "../utils/errors";

export const signatureUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 300 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "image/png" || file.mimetype === "image/jpeg") {
      cb(null, true);
      return;
    }
    cb(new AppError(400, "Only PNG and JPG signatures are allowed", "INVALID_SIGNATURE"));
  }
});

export const logoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "image/png" || file.mimetype === "image/jpeg") {
      cb(null, true);
      return;
    }
    cb(new AppError(400, "Only PNG and JPG logos are allowed", "INVALID_LOGO"));
  }
});
