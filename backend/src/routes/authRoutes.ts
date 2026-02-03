import { Router } from "express";
import { login, changePassword, me } from "../controllers/authController";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { changePasswordSchema, loginSchema } from "../validators";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in and receive a JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: "owner@receipta.local" }
 *               password: { type: string, example: "ChangeMe123!" }
 *     responses:
 *       200:
 *         description: JWT issued
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", validate({ body: loginSchema }), asyncHandler(login));

/**
 * @openapi
 * /api/v1/auth/change-password:
 *   post:
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     summary: Change the current user's password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string, example: "ChangeMe123!" }
 *               newPassword: { type: string, example: "NewPass123!" }
 *     responses:
 *       200:
 *         description: Password updated
 */
router.post(
  "/change-password",
  authenticate,
  validate({ body: changePasswordSchema }),
  asyncHandler(changePassword)
);

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     summary: Get current user
 *     responses:
 *       200:
 *         description: User details
 */
router.get("/me", authenticate, asyncHandler(me));

export default router;
