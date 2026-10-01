import { z } from 'zod';
import { APPLICATION_STATUS } from '../constants/index.js';
import { objectId, idParam } from './common.validator.js';

export const apply = {
  params: z.object({ jobId: objectId }),
  body: z.object({
    coverLetter: z.string().trim().max(5000).optional(),
    noticePeriodDays: z.coerce.number().int().min(0).max(365),
    // 0 = fresher
    experienceYears: z.coerce.number().min(0).max(60),
    // comma-separated string or repeated field
    skills: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform((v) => [...new Set((Array.isArray(v) ? v : (v || '').split(',')).flatMap((x) => x.split(',')).map((x) => x.trim()).filter(Boolean))]),
  }),
};
export const listForJob = { params: z.object({ jobId: objectId }) };
export const updateStatus = {
  params: z.object({ id: objectId }),
  body: z.object({ status: z.enum(APPLICATION_STATUS) }),
};

export { idParam };
export const resumeKey = { params: z.object({ key: z.string().regex(/^[\w-]{22}$/) }) };
