import { z } from 'zod';
import { JOB_TYPES, JOB_STATUS } from '../constants/index.js';
import { objectId, idParam, pagination } from './common.validator.js';

const base = z.object({
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().min(10),
  company: z.string().trim().min(2).max(150),
  location: z.string().trim().min(2).max(150),
  type: z.enum(JOB_TYPES),
  salaryMin: z.number().min(0),
  salaryMax: z.number().min(0),
  skills: z.array(z.string().trim().min(1)).max(30),
  status: z.enum(JOB_STATUS),
});
const salaryOk = (d) => d.salaryMin === undefined || d.salaryMax === undefined || d.salaryMin <= d.salaryMax;
const salaryMsg = { message: 'salaryMin cannot exceed salaryMax', path: ['salaryMin'] };

export { idParam };
export const create = {
  body: base.partial({ type: true, salaryMin: true, salaryMax: true, skills: true, status: true }).refine(salaryOk, salaryMsg),
};
export const update = { params: z.object({ id: objectId }), body: base.partial().strict().refine(salaryOk, salaryMsg) };
export const list = {
  query: z.object({
    ...pagination,
    search: z.string().trim().optional(),
    location: z.string().trim().optional(),
    type: z.enum(JOB_TYPES).optional(),
    status: z.enum(JOB_STATUS).optional(),
    sort: z.enum(['newest', 'oldest', 'salary']).default('newest'),
  }),
};
