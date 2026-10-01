import express from 'express';
import * as controller from '../controllers/job.controller.js';
import * as v from '../validators/job.validator.js';
import validate from '../middlewares/validate.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { ROLES } from '../constants/index.js';
import { jobApplicationRoutes as applicationRoutes } from './application.routes.js';
const router = express.Router();

/**
 * @openapi
 * /jobs:
 *   get:
 *     tags: [Jobs]
 *     summary: Search and list jobs (public)
 *     parameters:
 *       - { in: query, name: page, schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, default: 10 } }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: location, schema: { type: string } }
 *       - { in: query, name: type, schema: { type: string, enum: [full-time, part-time, contract, internship, remote] } }
 *       - { in: query, name: status, schema: { type: string, enum: [open, closed], default: open } }
 *       - { in: query, name: sort, schema: { type: string, enum: [newest, oldest, salary], default: newest } }
 *     responses:
 *       200:
 *         description: Paginated jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array, items: { $ref: '#/components/schemas/Job' } }
 *                 meta: { type: object, properties: { page: { type: integer }, limit: { type: integer }, total: { type: integer }, totalPages: { type: integer } } }
 *   post:
 *     tags: [Jobs]
 *     summary: Create a job (employer/admin)
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, description, company, location]
 *             properties:
 *               title: { type: string, example: Backend Engineer }
 *               description: { type: string, example: Build and maintain Node.js services. }
 *               company: { type: string, example: Acme Inc }
 *               location: { type: string, example: Kolkata }
 *               type: { type: string, enum: [full-time, part-time, contract, internship, remote] }
 *               salaryMin: { type: number, example: 600000 }
 *               salaryMax: { type: number, example: 1200000 }
 *               skills: { type: array, items: { type: string }, example: [node, mongodb] }
 *     responses:
 *       201: { description: Created }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get('/', validate(v.list), controller.list);
router.post('/', authenticate, authorize(ROLES.EMPLOYER, ROLES.ADMIN), validate(v.create), controller.create);

/**
 * @openapi
 * /jobs/{id}:
 *   get:
 *     tags: [Jobs]
 *     summary: Get a job by id (public)
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200:
 *         description: Job
 *         content: { application/json: { schema: { $ref: '#/components/schemas/Job' } } }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   patch:
 *     tags: [Jobs]
 *     summary: Update a job (owner/admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Job' }
 *     responses:
 *       200: { description: Updated }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Jobs]
 *     summary: Delete a job (owner/admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Deleted }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id', validate(v.idParam), controller.getById);
router.patch('/:id', authenticate, authorize(ROLES.EMPLOYER, ROLES.ADMIN), validate(v.update), controller.update);
router.delete('/:id', authenticate, authorize(ROLES.EMPLOYER, ROLES.ADMIN), validate(v.idParam), controller.remove);

// /jobs/:jobId/applications
router.use('/:jobId/applications', applicationRoutes);

export default router;
