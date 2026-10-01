import express from "express";
import * as controller from "../controllers/user.controller.js";
import * as v from "../validators/user.validator.js";
import validate from "../middlewares/validate.js";
import { uploadAvatar, cleanupOnInvalid } from "../middlewares/upload.js";
import { authenticate, authorize } from "../middlewares/auth.js";
import { ROLES } from "../constants/index.js";
const router = express.Router();

router.use(authenticate);

/**
 * @openapi
 * /users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current user profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Current user
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   patch:
 *     tags: [Users]
 *     summary: Update my profile (send only the fields to change)
 *     description: Candidates can set the education fields; employers can set totalEmployees. Setting a role-specific field for the other role returns 400.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar: { type: string, format: binary, description: Profile image or company logo (JPG, PNG or WEBP, max 2 MB) }
 *               name: { type: string, example: Jane Doe }
 *               phone: { type: string, example: '+91 98765 43210' }
 *               about: { type: string, maxLength: 1000, description: Short bio / about the company }
 *               address: { type: string, example: 12 Park Street }
 *               city: { type: string, example: Kolkata }
 *               state: { type: string, example: West Bengal }
 *               country: { type: string, example: India }
 *               totalEmployees: { type: integer, minimum: 1, example: 50, description: Employer only }
 *               educationLevel: { type: string, enum: [high-school, diploma, bachelor, master, doctorate, other], description: Candidate only }
 *               educationField: { type: string, example: Computer Science, description: Candidate only }
 *               educationInstitution: { type: string, example: Jadavpur University, description: Candidate only }
 *     responses:
 *       200: { description: Updated }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/me", controller.me);
router.patch("/me", uploadAvatar, cleanupOnInvalid(validate(v.updateMe)), controller.updateMe);

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List users (admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 10 } }
 *     responses:
 *       200:
 *         description: Users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array, items: { $ref: '#/components/schemas/User' } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get("/", authorize(ROLES.ADMIN), validate(v.listUsers), controller.list);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get a user by id (admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200:
 *         description: User
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Users]
 *     summary: Delete a user (admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *     responses:
 *       200: { description: Deleted }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get(
  "/:id",
  authorize(ROLES.ADMIN),
  validate(v.idParam),
  controller.getById,
);
router.delete(
  "/:id",
  authorize(ROLES.ADMIN),
  validate(v.idParam),
  controller.remove,
);

export default router;
