import rateLimit from 'express-rate-limit';
import env from '../config/env.js';

const message = { success: false, message: 'Too many requests, please try again later' };

export const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: env.RATE_LIMIT_MAX, standardHeaders: true, legacyHeaders: false, message });
export const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false, message });
