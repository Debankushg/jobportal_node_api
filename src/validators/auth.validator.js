import { z } from 'zod';
import { PROVIDER_NAMES } from '../config/oauth.config.js';
import { ROLES } from '../constants/index.js';

export const register = {
  body: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8).max(72),
    // admin accounts cannot be self-registered
    role: z.enum([ROLES.CANDIDATE, ROLES.EMPLOYER]).default(ROLES.CANDIDATE),
  }),
};
export const login = {
  body: z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) }),
};

export const oauthStart = {
  params: z.object({ provider: z.enum(PROVIDER_NAMES) }),
  query: z.object({ role: z.enum([ROLES.CANDIDATE, ROLES.EMPLOYER]).optional() }),
};
export const oauthCallback = { params: z.object({ provider: z.enum(PROVIDER_NAMES) }) };
