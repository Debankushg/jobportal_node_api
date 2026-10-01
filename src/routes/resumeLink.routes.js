import express from 'express';
import * as controller from '../controllers/application.controller.js';
import * as v from '../validators/application.validator.js';
import validate from '../middlewares/validate.js';

// short public resume link (/r/<key>); the unguessable key is the credential
const router = express.Router();
router.get('/:key', validate(v.resumeKey), controller.downloadResume);

export default router;
