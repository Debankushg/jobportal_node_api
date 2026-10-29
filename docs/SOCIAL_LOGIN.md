# Social login (Google, GitHub, LinkedIn)

Users can sign in or sign up with Google, GitHub or LinkedIn. The backend runs the OAuth 2.0 authorization-code flow and hands the browser our own JWT, so the rest of the API is unchanged.

## How it works

```
Browser                    Backend (API)                          Provider
   │  click "Google"           │                                      │
   ├──────────────────────────►│ GET /api/v1/auth/google?role=…       │
   │                           │ sets httpOnly cookie (nonce)         │
   │◄──────────────────────────┤ 302 → accounts.google.com?state=…    │
   ├─────────────────────────────────────────────────────────────────►│ user approves
   │◄─────────────────────────────────────────────────────────────────┤ 302 → /auth/google/callback?code&state
   ├──────────────────────────►│ verify state + cookie                │
   │                           │ code → access token ────────────────►│
   │                           │ access token → profile ─────────────►│
   │                           │ find / link / create user, sign JWT  │
   │◄──────────────────────────┤ 302 → FRONTEND/auth/callback#token=<jwt>&new=<0|1>
   │  frontend stores the token, loads /users/me, redirects           │
```

On failure the browser is sent to `FRONTEND/auth/callback#error=<code>`.

| Error code | Meaning |
|---|---|
| `provider_not_configured` | client id / secret not set for this provider |
| `access_denied` | the user cancelled on the provider's screen |
| `invalid_state` | missing/expired/forged state or cookie (CSRF protection) |
| `email_unverified` | the provider returned no verified email |
| `admin_not_allowed` | the email belongs to an admin account |
| `provider_failed` | provider rejected the code or could not be reached |
| `server_error` | anything unexpected (logged) |

## Account rules

- **New user** – created with the provider's name, email and avatar. The role comes from `?role=candidate|employer` on the start URL (the register form passes the selected role); otherwise `candidate`. There is no password.
- **Existing email** – if the provider returns the same **verified** email as an existing account, the provider is linked to it and the user signs in. Role and profile are not changed (the provider's avatar is used only if the user has none).
- **Returning user** – matched by provider account id first, so it keeps working even if the user changes their email at the provider.
- **Unverified emails are never used** to find or create accounts.
- **Admin accounts cannot use social login** (they must use email and password), so a compromised provider account cannot become an admin.
- A social-only account that tries email + password gets a 401 telling them to use social login.

## Setup

For each provider you need a client id and secret. The **redirect (callback) URL** to register is:

```
<BASE_URL>/api/v1/auth/<provider>/callback
```

| Environment | Redirect URL to register |
|---|---|
| Local | `http://localhost:9000/api/v1/auth/google/callback` (and `/github/`, `/linkedin/`) – use your `PORT` |
| Render | `https://job-portal-g89w.onrender.com/api/v1/auth/google/callback` (and `/github/`, `/linkedin/`) |

### Google
1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → **OAuth consent screen** (External), add yourself as a test user while in testing mode.
2. **Credentials → Create credentials → OAuth client ID → Web application.**
3. Add the redirect URL(s) above under *Authorized redirect URIs*.
4. Copy the client id and secret into `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

### GitHub
1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App.**
2. *Authorization callback URL*: the redirect URL above. (An OAuth App allows one callback URL, so create one app for local and one for production.)
3. Generate a client secret. Set `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`.
4. Scopes requested: `read:user user:email` (the verified primary email is read from the emails API, since the profile email is often private).

### LinkedIn
1. [LinkedIn Developers](https://www.linkedin.com/developers/apps) → **Create app** (a LinkedIn Page is required).
2. **Products** tab → request **Sign In with LinkedIn using OpenID Connect**.
3. **Auth** tab → add the redirect URL under *Authorized redirect URLs*.
4. Copy *Client ID* / *Primary Client Secret* into `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET`.

### Other settings
| Variable | Purpose |
|---|---|
| `BASE_URL` | public URL of this API; used to build the redirect URL sent to providers (on Render it falls back to `RENDER_EXTERNAL_URL`) |
| `FRONTEND_URL` | where the browser lands after login (defaults to the first `CORS_ORIGIN`, else `http://localhost:3000`) |

After changing env vars, restart the API. Providers without both id and secret stay disabled: clicking them returns the user to the frontend with `provider_not_configured`.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/auth/:provider` | `provider` = `google` \| `github` \| `linkedin`; optional `?role=candidate\|employer` for new accounts. Open in a browser, do not `fetch`. |
| GET | `/auth/:provider/callback` | called by the provider; redirects to the frontend |

Both share the strict `/auth/*` rate limit (20 requests / 15 min per IP); one sign-in uses two.

## Adding another provider
1. Add an entry to `src/config/oauth.config.js` (urls, scope, env vars) and the variables to `src/config/env.js`.
2. Add a profile fetcher to `src/services/oauth.service.js` returning `{ providerId, email, emailVerified, name, avatar }`.
3. Add the name to the `enum` in `src/models/user.model.js` and a button in `frontend/src/features/auth/social-buttons.tsx`.
