import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { idParamSchema } from "../validators";
import { getReceipt, getReceiptPdf } from "../controllers/receiptController";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

/**
 * @openapi
 * /api/v1/receipts/{id}:
 *   get:
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     summary: Get a receipt
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Receipt details
 */
router.get(
  "/receipts/:id",
  authenticate,
  validate({ params: idParamSchema }),
  asyncHandler(getReceipt)
);

/**
 * @openapi
 * /api/v1/receipts/{id}/pdf:
 *   get:
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     summary: Download receipt PDF
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Receipt PDF
 */
router.get(
  "/receipts/:id/pdf",
  authenticate,
  validate({ params: idParamSchema }),
  asyncHandler(getReceiptPdf)
);

export default router;
