import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { idParamSchema, paymentCreateSchema, paymentReversalSchema } from "../validators";
import { createPayment, createReversal, listPayments } from "../controllers/paymentController";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

/**
 * @openapi
 * /api/v1/invoices/{id}/payments:
 *   post:
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     summary: Record a payment
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, method]
 *             properties:
 *               amount: { type: number, example: 100 }
 *               method: { type: string, example: "CARD" }
 *     responses:
 *       201:
 *         description: Payment created
 */
router.post(
  "/invoices/:id/payments",
  authenticate,
  validate({ params: idParamSchema, body: paymentCreateSchema }),
  asyncHandler(createPayment)
);

/**
 * @openapi
 * /api/v1/invoices/{id}/payments/reversal:
 *   post:
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     summary: Record a payment reversal
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, method]
 *             properties:
 *               amount: { type: number, example: 50 }
 *               method: { type: string, example: "REVERSAL" }
 *     responses:
 *       201:
 *         description: Reversal created
 */
router.post(
  "/invoices/:id/payments/reversal",
  authenticate,
  validate({ params: idParamSchema, body: paymentReversalSchema }),
  asyncHandler(createReversal)
);

/**
 * @openapi
 * /api/v1/invoices/{id}/payments:
 *   get:
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     summary: List payments for an invoice
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Payments list
 */
router.get(
  "/invoices/:id/payments",
  authenticate,
  validate({ params: idParamSchema }),
  asyncHandler(listPayments)
);

export default router;
