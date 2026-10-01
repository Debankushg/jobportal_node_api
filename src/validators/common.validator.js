import { z } from 'zod';

export const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');
export const idParam = { params: z.object({ id: objectId }) };
export const pagination = {
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
};

// multipart forms (e.g. Swagger) send blank fields as '', so treat them as not provided
export const blank = (schema) => z.preprocess((v) => (v === '' ? undefined : v), schema.optional());
