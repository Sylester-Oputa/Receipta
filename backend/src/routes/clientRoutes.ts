import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  archiveClient,
  createClient,
  getClient,
  listClients,
  updateClient
} from "../controllers/clientController";
import { clientCreateSchema, clientUpdateSchema, idParamSchema } from "../validators";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

/**
 * @openapi
 * /api/v1/clients:
 *   post:
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     summary: Create a client
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string, example: "Acme Corp" }
 *               email: { type: string, example: "billing@acme.com" }
 *     responses:
 *       201:
 *         description: Client created
 */
router.post("/", authenticate, validate({ body: clientCreateSchema }), asyncHandler(createClient));

/**
 * @openapi
 * /api/v1/clients:
 *   get:
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     summary: List clients
 *     parameters:
 *       - in: query
 *         name: includeArchived
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Clients list
 */
router.get("/", authenticate, asyncHandler(listClients));

/**
 * @openapi
 * /api/v1/clients/{id}:
 *   get:
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     summary: Get a client
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Client details
 */
router.get("/:id", authenticate, validate({ params: idParamSchema }), asyncHandler(getClient));

/**
 * @openapi
 * /api/v1/clients/{id}:
 *   patch:
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     summary: Update a client
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
 *               name: { type: string }
 *               email: { type: string }
 *     responses:
 *       200:
 *         description: Updated client
 */
router.patch(
  "/:id",
  authenticate,
  validate({ params: idParamSchema, body: clientUpdateSchema }),
  asyncHandler(updateClient)
);

/**
 * @openapi
 * /api/v1/clients/{id}/archive:
 *   patch:
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     summary: Archive a client
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Client archived
 */
router.patch(
  "/:id/archive",
  authenticate,
  validate({ params: idParamSchema }),
  asyncHandler(archiveClient)
);

export default router;
