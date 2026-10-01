import { z } from 'zod';
import { EDUCATION_LEVELS } from '../constants/index.js';
import { idParam, pagination, blank } from './common.validator.js';

const text = (max) => blank(z.string().trim().max(max));

export const updateMe = {
  body: z
    .object({
      name: blank(z.string().trim().min(2).max(100)),
      phone: blank(z.string().trim().regex(/^\+?[0-9\s-]{7,15}$/, 'Invalid phone number')),
      about: text(1000),
      address: text(300),
      city: text(100),
      state: text(100),
      country: text(100),
      totalEmployees: blank(z.coerce.number().int().min(1)),
      educationLevel: blank(z.enum(EDUCATION_LEVELS)),
      educationField: text(100),
      educationInstitution: text(150),
    })
    .strict(),
};
export const listUsers = { query: z.object(pagination) };
export { idParam };
