import { Router } from "express";
import { publicRateLimit } from "../middleware/rateLimit";
import { validate } from "../middleware/validate";
import { tokenParamSchema } from "../validators";
import { getInvoicePdfPublic, signInvoice, viewInvoice } from "../controllers/publicController";
import { signatureUpload } from "../middleware/upload";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

/**
 * @openapi
 * /api/v1/public/invoices/view/{token}:
 *   get:
 *     tags: [Public]
 *     summary: View invoice via token
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Public invoice view
 */
router.get(
  "/invoices/view/:token",
  publicRateLimit,
  validate({ params: tokenParamSchema }),
  asyncHandler(viewInvoice)
);

/**
 * @openapi
 * /api/v1/public/invoices/pdf/{token}:
 *   get:
 *     tags: [Public]
 *     summary: Download invoice PDF via token
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: signed
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Invoice PDF
 */
router.get(
  "/invoices/pdf/:token",
  publicRateLimit,
  validate({ params: tokenParamSchema }),
  asyncHandler(getInvoicePdfPublic)
);

/**
 * @openapi
 * /api/v1/public/invoices/sign/{token}:
 *   post:
 *     tags: [Public]
 *     summary: Sign an invoice via token
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [signerName, signerEmail, acknowledge]
 *             properties:
 *               signerName: { type: string }
 *               signerEmail: { type: string }
 *               acknowledge: { type: boolean }
 *               signatureFile: { type: string, format: binary }
 *         application/json:
 *           schema:
 *             type: object
 *             required: [signerName, signerEmail, acknowledge]
 *             properties:
 *               signerName: { type: string }
 *               signerEmail: { type: string }
 *               acknowledge: { type: boolean }
 *               signatureDataUrl: { type: string }
 *               signatureImageBase64: { type: string }
 *     responses:
 *       200:
 *         description: Invoice signed
 */
router.post(
  "/invoices/sign/:token",
  publicRateLimit,
  validate({ params: tokenParamSchema }),
  signatureUpload.single("signatureFile"),
  asyncHandler(signInvoice)
);

export default router;
