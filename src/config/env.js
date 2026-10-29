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
  // public origin used to build file links in API responses; defaults to RENDER_EXTERNAL_URL, then http://localhost:PORT
  BASE_URL: z.string().url().optional(),
  CORS_ORIGIN: z.string().default('*'),
  // where the browser is sent after social login; defaults to the first CORS_ORIGIN, else http://localhost:3000
  FRONTEND_URL: z.string().url().optional(),
  // social login: a provider is enabled only when both its id and secret are set
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  LINKEDIN_CLIENT_ID: z.string().optional(),
  LINKEDIN_CLIENT_SECRET: z.string().optional(),
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

if (parsed.data.NODE_ENV === 'production' && /\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])[:/]/.test(parsed.data.MONGO_URI))
  console.warn('WARNING: MONGO_URI points at localhost in production. A hosted server cannot reach your local MongoDB; use a hosted database such as MongoDB Atlas.');

// BASE_URL wins; on Render the platform provides RENDER_EXTERNAL_URL; otherwise assume local development
const baseUrl = parsed.data.BASE_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${parsed.data.PORT}`;

const firstOrigin = parsed.data.CORS_ORIGIN.split(',').map((o) => o.trim()).find((o) => o && o !== '*');
const frontendUrl = parsed.data.FRONTEND_URL || firstOrigin || 'http://localhost:3000';

export default { ...parsed.data, BASE_URL: baseUrl.replace(/\/$/, ''), FRONTEND_URL: frontendUrl.replace(/\/$/, '') };
