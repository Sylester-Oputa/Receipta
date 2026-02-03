import crypto from "crypto";

export const hashSha256 = (input: string | Buffer): string =>
  crypto.createHash("sha256").update(input).digest("hex");

export const generateToken = (bytes = 48): string => {
  if (bytes < 32 || bytes > 64) {
    throw new Error("Token byte length must be between 32 and 64");
  }
  return crypto.randomBytes(bytes).toString("base64url");
};
