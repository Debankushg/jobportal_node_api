import express from "express";
import * as controller from "../controllers/auth.controller.js";
import * as oauthController from "../controllers/oauth.controller.js";
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

/**
 * @openapi
 * /auth/{provider}:
 *   get:
 *     tags: [Auth]
 *     summary: Start social login (Google, GitHub or LinkedIn)
 *     description: |
 *       Open this URL in a browser (do not call it with fetch). It redirects to the provider's consent screen.
 *       After approval the provider calls `/auth/{provider}/callback`, which redirects to the frontend at
 *       `/auth/callback#token=<jwt>&new=<0|1>`, or `#error=<code>` if sign-in failed.
 *     parameters:
 *       - { in: path, name: provider, required: true, schema: { type: string, enum: [google, github, linkedin] } }
 *       - { in: query, name: role, schema: { type: string, enum: [candidate, employer], default: candidate }, description: Role for a NEW account; ignored for existing users }
 *     responses:
 *       302: { description: Redirect to the provider (or to the frontend with an error code) }
 *       400: { $ref: '#/components/responses/ValidationError' }
 * /auth/{provider}/callback:
 *   get:
 *     tags: [Auth]
 *     summary: OAuth redirect target (called by the provider, not by clients)
 *     description: Register this URL as the redirect / callback URL in the provider's developer console.
 *     parameters:
 *       - { in: path, name: provider, required: true, schema: { type: string, enum: [google, github, linkedin] } }
 *       - { in: query, name: code, schema: { type: string } }
 *       - { in: query, name: state, schema: { type: string } }
 *     responses:
 *       302: { description: Redirect to the frontend with a token or an error code }
 */
router.get("/:provider", validate(v.oauthStart), oauthController.start);
router.get("/:provider/callback", validate(v.oauthCallback), oauthController.callback);

export default router;
