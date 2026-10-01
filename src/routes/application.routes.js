import express from 'express';
import * as controller from '../controllers/application.controller.js';
import * as v from '../validators/application.validator.js';
import validate from '../middlewares/validate.js';
import { uploadResume, cleanupOnInvalid } from '../middlewares/upload.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { ROLES } from '../constants/index.js';

/**
 * @openapi
 * /jobs/{jobId}/applications:
 *   post:
 *     tags: [Applications]
 *     summary: Apply to a job (candidate)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: jobId, required: true, schema: { type: string } }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [resume, noticePeriodDays, experienceYears]
 *             properties:
 *               resume: { type: string, format: binary, description: PDF, DOC or DOCX, max 5 MB }
 *               coverLetter: { type: string, maxLength: 5000 }
 *               noticePeriodDays: { type: integer, minimum: 0, example: 30, description: Notice period in days (0 = immediately available) }
 *               experienceYears: { type: number, minimum: 0, example: 0, description: Years of experience (0 = fresher) }
 *               skills: { type: string, example: 'node, mongodb', description: Comma-separated }
 *     responses:
 *       201: { description: Application submitted }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { description: Already applied }
 *   get:
 *     tags: [Applications]
 *     summary: List applications for a job (job owner/admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: jobId, required: true, schema: { type: string } }]
 *     responses:
 *       200:
 *         description: Applications
 *         content:
 *           application/json:
 *             schema: { type: array, items: { $ref: '#/components/schemas/Application' } }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
export const jobApplicationRoutes = express.Router({ mergeParams: true });
jobApplicationRoutes.post('/', authenticate, authorize(ROLES.CANDIDATE), uploadResume, cleanupOnInvalid(validate(v.apply)), controller.apply);
jobApplicationRoutes.get('/', authenticate, authorize(ROLES.EMPLOYER, ROLES.ADMIN), validate(v.listForJob), controller.listForJob);

const router = express.Router();
router.use(authenticate);

/**
 * @openapi
 * /applications/me:
 *   get:
 *     tags: [Applications]
 *     summary: List my applications (candidate)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: My applications }
 * /applications/{id}/status:
 *   patch:
 *     tags: [Applications]
 *     summary: Update an application's status (job owner/admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [applied, reviewing, shortlisted, rejected, hired] }
 *     responses:
 *       200: { description: Updated }
 *       403: { $ref: '#/components/responses/Forbidden' }
 * /applications/{id}:
 *   delete:
 *     tags: [Applications]
 *     summary: Withdraw an application (owner candidate/admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Withdrawn }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/me', authorize(ROLES.CANDIDATE), controller.listMine);
router.patch('/:id/status', authorize(ROLES.EMPLOYER, ROLES.ADMIN), validate(v.updateStatus), controller.updateStatus);
router.delete('/:id', authorize(ROLES.CANDIDATE, ROLES.ADMIN), validate(v.idParam), controller.withdraw);

export default router;

