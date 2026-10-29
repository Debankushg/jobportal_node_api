import env from './env.js';

// Authorization-code flow endpoints for each supported provider.
// To add one: add an entry here, a profile mapper in services/oauth.service.js, and its env vars in config/env.js.
export const PROVIDERS = {
  google: {
    label: 'Google',
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scope: 'openid email profile',
    params: { prompt: 'select_account' },
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  },
  github: {
    label: 'GitHub',
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scope: 'read:user user:email',
    params: {},
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
  },
  linkedin: {
    label: 'LinkedIn',
    authorizeUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    // "Sign in with LinkedIn using OpenID Connect"
    scope: 'openid profile email',
    params: {},
    clientId: env.LINKEDIN_CLIENT_ID,
    clientSecret: env.LINKEDIN_CLIENT_SECRET,
  },
};

export const PROVIDER_NAMES = Object.keys(PROVIDERS);
export const isConfigured = (name) => Boolean(PROVIDERS[name]?.clientId && PROVIDERS[name]?.clientSecret);

// the URL to register as the "redirect / callback URL" in each provider's developer console
export const callbackUrl = (name) => `${env.BASE_URL}/api/v1/auth/${name}/callback`;
