import express from "express";
import * as controller from "../controllers/auth.controller.js";
import * as v from "../validators/auth.validator.js";
import validate from "../middlewares/validate.js";
const router = express.Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a candidate or employer account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: Jane Doe }
 *               email: { type: string, format: email, example: jane@example.com }
 *               password: { type: string, minLength: 8, maxLength: 72, example: Password123 }
 *               role: { type: string, enum: [candidate, employer], default: candidate }
 *     responses:
 *       201: { description: Registered }
 *       400: { $ref: '#/components/responses/ValidationError' }
 */
router.post("/register", validate(v.register), controller.register);

/**
 * @openapi
 * /auth/login:
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
 *               email: { type: string, format: email, example: jane@example.com }
 *               password: { type: string, example: Password123 }
 *     responses:
 *       200: { description: Logged in, returns token }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post("/login", validate(v.login), controller.login);

export default router;
