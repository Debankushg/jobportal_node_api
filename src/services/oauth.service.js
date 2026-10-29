import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { PROVIDERS, callbackUrl } from '../config/oauth.config.js';
import { ROLES } from '../constants/index.js';
import * as userRepository from '../repositories/user.repository.js';
import { signToken } from './auth.service.js';

// An error that the browser is told about by code (shown by the frontend), never by raw message.
export class OAuthError extends Error {
  constructor(code, message) {
    super(message ?? code);
    this.code = code;
  }
}

const SIGNUP_ROLES = [ROLES.CANDIDATE, ROLES.EMPLOYER];
const STATE_TTL = '10m';

/* ---------------- state (CSRF protection) ----------------
   The state is a signed token holding a random nonce. The same nonce is also set in an httpOnly cookie
   on /auth/:provider, and both must match on the callback, so a callback cannot be forged for another browser. */

export const createState = (provider, role) => {
  const nonce = crypto.randomBytes(16).toString('base64url');
  const safeRole = SIGNUP_ROLES.includes(role) ? role : ROLES.CANDIDATE;
  const state = jwt.sign({ purpose: 'oauth', provider, role: safeRole, nonce }, env.JWT_SECRET, { expiresIn: STATE_TTL });
  return { state, nonce };
};

export const verifyState = (provider, state, cookieNonce) => {
  let payload;
  try {
    payload = jwt.verify(state ?? '', env.JWT_SECRET);
  } catch {
    throw new OAuthError('invalid_state', 'State is invalid or expired');
  }
  const a = Buffer.from(String(payload.nonce));
  const b = Buffer.from(String(cookieNonce ?? ''));
  if (payload.purpose !== 'oauth' || payload.provider !== provider || a.length !== b.length || !crypto.timingSafeEqual(a, b))
    throw new OAuthError('invalid_state', 'State does not match this browser');
  return { role: payload.role };
};

/* ---------------- talking to the provider ---------------- */

const request = async (url, options = {}) => {
  let res;
  try {
    res = await fetch(url, { ...options, signal: AbortSignal.timeout(10_000) });
  } catch {
    throw new OAuthError('provider_failed', `Could not reach ${new URL(url).host}`);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok || body?.error) throw new OAuthError('provider_failed', `${new URL(url).host} responded with ${res.status}${body?.error ? `: ${body.error}` : ''}`);
  return body;
};

export const buildAuthorizeUrl = (provider, state) => {
  const p = PROVIDERS[provider];
  const url = new URL(p.authorizeUrl);
  const params = { response_type: 'code', client_id: p.clientId, redirect_uri: callbackUrl(provider), scope: p.scope, state, ...p.params };
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
};

const exchangeCode = async (provider, code) => {
  const p = PROVIDERS[provider];
  const body = await request(p.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: callbackUrl(provider),
      client_id: p.clientId,
      client_secret: p.clientSecret,
    }),
  });
  if (!body?.access_token) throw new OAuthError('provider_failed', 'Provider did not return an access token');
  return body.access_token;
};

// Each mapper returns { providerId, email, emailVerified, name, avatar }.
// Google and LinkedIn both speak OpenID Connect, so they share the same "userinfo" shape.
const fromOpenId = (info) => ({
  providerId: String(info.sub),
  email: info.email,
  emailVerified: info.email_verified === true || info.email_verified === 'true',
  name: info.name || [info.given_name, info.family_name].filter(Boolean).join(' '),
  avatar: info.picture,
});

const fetchers = {
  google: async (token) => fromOpenId(await request('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${token}` } })),
  linkedin: async (token) => fromOpenId(await request('https://api.linkedin.com/v2/userinfo', { headers: { Authorization: `Bearer ${token}` } })),
  github: async (token) => {
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'User-Agent': 'job-portal' };
    const user = await request('https://api.github.com/user', { headers });
    // the profile email is often private, so ask for the verified primary address explicitly
    const emails = await request('https://api.github.com/user/emails', { headers }).catch(() => []);
    const primary = Array.isArray(emails) ? emails.find((e) => e.primary && e.verified) : undefined;
    return { providerId: String(user.id), email: primary?.email, emailVerified: Boolean(primary), name: user.name || user.login, avatar: user.avatar_url };
  },
};

export const fetchProfile = async (provider, code) => fetchers[provider](await exchangeCode(provider, code));

/* ---------------- find, link or create the user ---------------- */

export const signInWithProfile = async (provider, profile, role) => {
  // an unverified email could be claimed by someone else, so it is never used to find or create an account
  if (!profile.email || !profile.emailVerified) throw new OAuthError('email_unverified', `${PROVIDERS[provider].label} did not return a verified email address`);
  const email = profile.email.toLowerCase();

  let user = await userRepository.findByProvider(provider, profile.providerId);
  let isNew = false;

  if (!user) {
    user = await userRepository.findByEmail(email);
    if (user) {
      if (user.role === ROLES.ADMIN) throw new OAuthError('admin_not_allowed', 'Admin accounts must sign in with email and password');
      // same verified email: attach this provider to the existing account
      user.providers.push({ provider, providerId: profile.providerId });
      if (!user.avatar && profile.avatar) user.avatar = profile.avatar;
      await userRepository.save(user);
    } else {
      user = await userRepository.create({
        name: (profile.name || email.split('@')[0]).slice(0, 100),
        email,
        avatar: profile.avatar,
        role,
        providers: [{ provider, providerId: profile.providerId }],
      });
      isNew = true;
    }
  }
  if (user.role === ROLES.ADMIN) throw new OAuthError('admin_not_allowed', 'Admin accounts must sign in with email and password');

  return { user, token: signToken(user), isNew };
};
