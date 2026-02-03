import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  createInvoice,
  getInvoice,
  getInvoicePdf,
  listInvoices,
  reviseInvoice,
  sendInvoice,
  updateInvoice,
  voidInvoice
} from "../controllers/invoiceController";
import { idParamSchema, invoiceCreateSchema, invoiceUpdateSchema } from "../validators";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

/**
 * @openapi
 * /api/v1/invoices:
 *   post:
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     summary: Create an invoice (DRAFT)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clientId, currency, items]
 *             properties:
 *               clientId: { type: string }
 *               currency: { type: string, example: "USD" }
 *               taxRate: { type: number, example: 7.5 }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     description: { type: string, example: "Design work" }
 *                     qty: { type: number, example: 2 }
 *                     unitPrice: { type: number, example: 150 }
 *     responses:
 *       201:
 *         description: Invoice created
 */
router.post("/", authenticate, validate({ body: invoiceCreateSchema }), asyncHandler(createInvoice));

/**
 * @openapi
 * /api/v1/invoices:
 *   get:
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     summary: List invoices
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Invoices list
 */
router.get("/", authenticate, asyncHandler(listInvoices));

/**
 * @openapi
 * /api/v1/invoices/{id}:
 *   get:
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     summary: Get an invoice
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Invoice details
 */
router.get("/:id", authenticate, validate({ params: idParamSchema }), asyncHandler(getInvoice));

/**
 * @openapi
 * /api/v1/invoices/{id}:
 *   patch:
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     summary: Update a DRAFT invoice
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
 *             properties:
 *               currency: { type: string }
 *               taxRate: { type: number }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Invoice updated
 */
router.patch(
  "/:id",
  authenticate,
  validate({ params: idParamSchema, body: invoiceUpdateSchema }),
  asyncHandler(updateInvoice)
);

/**
 * @openapi
 * /api/v1/invoices/{id}/send:
 *   post:
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     summary: Send an invoice (generate public tokens)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Invoice sent
 */
router.post(
  "/:id/send",
  authenticate,
  validate({ params: idParamSchema }),
  asyncHandler(sendInvoice)
);

/**
 * @openapi
 * /api/v1/invoices/{id}/revise:
 *   post:
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     summary: Create a revision of a non-draft invoice
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Invoice revision created
 */
router.post(
  "/:id/revise",
  authenticate,
  validate({ params: idParamSchema }),
  asyncHandler(reviseInvoice)
);

/**
 * @openapi
 * /api/v1/invoices/{id}/void:
 *   post:
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     summary: Void an invoice (only if not signed and no payments)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Invoice voided
 */
router.post(
  "/:id/void",
  authenticate,
  validate({ params: idParamSchema }),
  asyncHandler(voidInvoice)
);

/**
 * @openapi
 * /api/v1/invoices/{id}/pdf:
 *   get:
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     summary: Download invoice PDF
 *     parameters:
 *       - in: path
 *         name: id
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
  "/:id/pdf",
  authenticate,
  validate({ params: idParamSchema }),
  asyncHandler(getInvoicePdf)
);

export default router;
