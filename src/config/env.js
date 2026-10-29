import 'dotenv/config';
import { z } from 'zod';

// hosting dashboards often hold values like `Production`, `"production"`, `prod` or an empty string
const ALIASES = { dev: 'development', prod: 'production' };
const nodeEnv = z.preprocess((v) => {
  if (typeof v !== 'string') return v;
  const clean = v.trim().replace(/^["']|["']$/g, '').trim().toLowerCase();
  return clean === '' ? undefined : (ALIASES[clean] ?? clean);
}, z.enum(['development', 'test', 'production']).default('development'));

const schema = z.object({
  NODE_ENV: nodeEnv,
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().min(1),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('1d'),
  // public origin used to build file links in API responses; defaults to http://localhost:PORT
  BASE_URL: z.string().url().optional(),
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  LOG_LEVEL: z.string().default('info'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const fieldErrors = parsed.error.flatten().fieldErrors;
  console.error('Invalid environment configuration:', fieldErrors);
  // safe to print: NODE_ENV is not a secret, and seeing the raw value makes typos obvious
  if (fieldErrors.NODE_ENV) console.error(`NODE_ENV received: ${JSON.stringify(process.env.NODE_ENV)}`);
  process.exit(1);
}

export default { ...parsed.data, BASE_URL: (parsed.data.BASE_URL || `http://localhost:${parsed.data.PORT}`).replace(/\/$/, '') };
