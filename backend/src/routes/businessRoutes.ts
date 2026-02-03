import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { getBusiness, updateBusiness } from "../controllers/businessController";
import { businessUpdateSchema } from "../validators";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

/**
 * @openapi
 * /api/v1/business:
 *   get:
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     summary: Get the current business
 *     responses:
 *       200:
 *         description: Business details
 */
router.get("/", authenticate, asyncHandler(getBusiness));

/**
 * @openapi
 * /api/v1/business:
 *   put:
 *     tags: [Business]
 *     security:
 *       - bearerAuth: []
 *     summary: Update business profile
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: "Receipta LLC" }
 *               businessCode: { type: string, example: "RCP" }
 *               brandingPrimaryColor: { type: string, example: "#0F766E" }
 *     responses:
 *       200:
 *         description: Updated business
 */
router.put(
  "/",
  authenticate,
  validate({ body: businessUpdateSchema }),
  asyncHandler(updateBusiness)
);

export default router;
