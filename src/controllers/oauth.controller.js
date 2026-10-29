import env from '../config/env.js';
import { isConfigured } from '../config/oauth.config.js';
import logger from '../config/logger.js';
import * as oauthService from '../services/oauth.service.js';
import { readCookie } from '../utils/cookies.js';

const NONCE_COOKIE = 'oauth_nonce';
const cookieOptions = { httpOnly: true, secure: env.NODE_ENV === 'production', sameSite: 'lax', path: '/api/v1/auth' };

// The browser is mid-redirect, so failures go back to the frontend (as a code in the URL fragment), not as JSON.
const toFrontend = (res, params) => {
  res.set('Cache-Control', 'no-store');
  res.redirect(`${env.FRONTEND_URL}/auth/callback#${new URLSearchParams(params)}`);
};

export const start = (req, res) => {
  const { provider } = req.params;
  if (!isConfigured(provider)) return toFrontend(res, { error: 'provider_not_configured' });

  const { state, nonce } = oauthService.createState(provider, req.query.role);
  res.cookie(NONCE_COOKIE, nonce, { ...cookieOptions, maxAge: 10 * 60 * 1000 });
  res.redirect(oauthService.buildAuthorizeUrl(provider, state));
};

export const callback = async (req, res) => {
  const { provider } = req.params;
  const { code, state, error } = req.query;
  const nonce = readCookie(req, NONCE_COOKIE);
  res.clearCookie(NONCE_COOKIE, cookieOptions); // single use, whatever the outcome

  try {
    if (!isConfigured(provider)) throw new oauthService.OAuthError('provider_not_configured');
    if (error) throw new oauthService.OAuthError(error === 'access_denied' ? 'access_denied' : 'provider_failed', String(error));
    if (typeof code !== 'string' || !code) throw new oauthService.OAuthError('invalid_state', 'Missing authorization code');

    const { role } = oauthService.verifyState(provider, state, nonce);
    const profile = await oauthService.fetchProfile(provider, code);
    const { token, isNew } = await oauthService.signInWithProfile(provider, profile, role);
    // token goes in the fragment so it is never sent to a server or written to access logs
    toFrontend(res, { token, new: isNew ? '1' : '0' });
  } catch (err) {
    const known = err instanceof oauthService.OAuthError;
    (req.log || logger)[known ? 'warn' : 'error']({ err, provider }, 'Social login failed');
    toFrontend(res, { error: known ? err.code : 'server_error' });
  }
};
