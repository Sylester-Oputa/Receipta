import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { getSetupStatus, createOwner } from "../controllers/setupController";
import { validate } from "../middleware/validate";
import { setupOwnerSchema } from "../validators";

const router = Router();

/**
 * @openapi
 * /api/v1/setup/status:
 *   get:
 *     tags: [Setup]
 *     summary: Check if initial setup is complete
 *     responses:
 *       200:
 *         description: Setup status
 */
router.get("/status", asyncHandler(getSetupStatus));

/**
 * @openapi
 * /api/v1/setup/owner:
 *   post:
 *     tags: [Setup]
 *     summary: Create the initial business owner account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [business, owner]
 *             properties:
 *               business:
 *                 type: object
 *                 required: [name, businessCode]
 *                 properties:
 *                   name: { type: string, example: "Acme Ltd" }
 *                   businessCode: { type: string, example: "ACME" }
 *                   email: { type: string, example: "info@acme.com" }
 *                   phone: { type: string, example: "+234..." }
 *                   address: { type: string, example: "123 Main St" }
 *               owner:
 *                 type: object
 *                 required: [email, password]
 *                 properties:
 *                   email: { type: string, example: "owner@acme.com" }
 *                   password: { type: string, example: "StrongPassword123!" }
 *               branding:
 *                 type: object
 *                 properties:
 *                   primaryColor: { type: string, example: "#0F172A" }
 *     responses:
 *       201:
 *         description: Setup completed
 *       409:
 *         description: Setup already done
 */
router.post("/owner", validate({ body: setupOwnerSchema }), asyncHandler(createOwner));

export default router;
