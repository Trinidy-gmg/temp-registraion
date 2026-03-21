# RegistrationPage — authentication flow (in depth)

This document describes **how sign-in works** in the Hollowed Oath **RegistrationPage** (Next.js on Vercel), **which services are called**, **what secrets apply where**, and **how NextAuth + cookies fit together**.

---

## High-level architecture

```
Browser (RegistrationPage on Vercel)
    │
    │  signIn("credentials", { email, password })  →  POST /api/auth/callback/credentials (NextAuth)
    ▼
NextAuth Credentials `authorize`  (auth.ts)
    │
    │  POST {ADMINSITE_AUTH_BASE_URL}/api/auth/login
    │  Body: { email, password }
    │  (no API key on this hop — public AdminSite demo endpoints)
    ▼
AdminSite  app/api/auth/login/route.ts
    │
    │  POST {HAMS_API_URL}/login
    │  Headers: Content-Type, X-API-Key: {HAMS_API_KEY}
    ▼
HAMS (Account / JWT service)
```

**Important:** RegistrationPage **never** holds `HAMS_API_KEY`. Only **AdminSite** (and your HAMS deployment) does. RegistrationPage needs **`ADMINSITE_AUTH_BASE_URL`**, **`AUTH_SECRET`** (or `NEXTAUTH_SECRET`), and **`AUTH_URL`** (or `NEXTAUTH_URL`) for production.

**Session storage:** The app uses **NextAuth (Auth.js v5)** with a **JWT session**. The encrypted session cookie is **small**: it stores **account id (HRID)** and **email** only. **HAMS `access_token` / `refresh_token` are not** written to browser cookies (avoids ~8KB `Set-Cookie` / proxy 500 issues from large JWTs).

---

## Environment variables (who needs what)

### RegistrationPage (Vercel)

| Variable | Used for |
|----------|-----------|
| `ADMINSITE_AUTH_BASE_URL` | Server-side calls to AdminSite: `/api/auth/login`, `/api/auth/register`, `/api/auth/mark-email-verified` |
| `AUTH_SECRET` | NextAuth JWT encryption (required in production). Also accepts `NEXTAUTH_SECRET`. |
| `AUTH_URL` | Public origin of this app (e.g. `https://temp-registraion.vercel.app`). Also accepts `NEXTAUTH_URL`. |
| `REGISTRATION_VERIFY_SECRET` | Header `X-Registration-Verify-Secret` when calling **mark-email-verified** only (must match AdminSite) |
| `SIGNUP_VERIFY_SECRET` | Signing the httpOnly `ho_email_verify` cookie (8-digit code flow) |
| SendGrid vars | Sending verification email |

**Credentials sign-in** does not use `REGISTRATION_VERIFY_SECRET` or `SIGNUP_VERIFY_SECRET`.

### AdminSite (K8s / Docker / etc.)

| Variable | Used for |
|----------|-----------|
| `HAMS_API_URL` | Base URL for HAMS |
| `HAMS_API_KEY` | Sent as `X-API-Key` on every forward to HAMS for login, register, mark-verified, etc. |
| `REGISTRATION_VERIFY_SECRET` | Validates `POST /api/auth/mark-email-verified` in production |

### HAMS

| Variable | Role |
|----------|------|
| API key in DB | Must match `HAMS_API_KEY` when `REQUIRE_API_KEY` is enabled |
| JWT keys | Issues `access_token` / `refresh_token` on successful login |

---

## End-to-end: successful sign-in from the home page

1. **User** submits email + password on **`/login`** (`SignInForm`).
2. **Browser** calls **`signIn("credentials", { redirect: false, … })`** (NextAuth client).
3. **NextAuth** runs **`authorize`** in `auth.ts`:
   - Calls AdminSite: `POST {base}/api/auth/login` with `{ email, password }`.
4. **AdminSite** forwards to HAMS; HAMS returns tokens + `account_id`.
5. **`authorize`** uses **`coerceLoginTokens()`** to read the JSON shape, then returns **`{ id: account_id, email }`** (tokens are discarded after this step).
6. **NextAuth** issues an **encrypted JWT session cookie** (default cookie name: `authjs.session-token` in many setups).
7. **Browser** navigates to **`/signedin`**.
8. **`/signedin`** uses **`auth()`** from `auth.ts`. If no session → redirect to `/login?reason=not_signed_in`.

---

## Email verification + sign-in (signup flow)

1. **Register:** `POST /api/auth/register` → AdminSite → HAMS.
2. **Verification email** + signed cookie `ho_email_verify`.
3. **Confirm code:** `POST /api/auth/verification/confirm` → mark verified; clears `ho_email_verify`.
4. **Browser** calls **`fetchLoginAfterVerification()`** → **`signIn("credentials")`** (retries once on `EMAIL_NOT_VERIFIED`).
5. Redirect **`/signedin`**.

**Resume (sign-in while unverified):** `POST /api/auth/verification/resume` may return `{ ok: true, account_id }` when the user is already verified; the client then calls **`signIn("credentials")`** to open the NextAuth session (the route no longer sets HAMS cookies).

---

## API reference (RegistrationPage)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` / `POST` | `/api/auth/*` | **NextAuth** (e.g. session, CSRF, credentials callback). Do not add a competing `app/api/auth/login` route. |
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/verification/confirm` | Validate 8-digit code + mark verified |
| `POST` | `/api/auth/verification/resend` | New code (cookie session) |
| `POST` | `/api/auth/verification/resume` | Login attempt; if unverified, send code path; if verified, returns `ok` + `account_id` (client must `signIn`) |
| `GET` | `/api/me` | JSON: authenticated + `user.id` / `user.email` for **this demo site** (same session as `/signedin`) |
| `GET` | `/api/auth/ping` | Health / deploy fingerprint (if present in repo) |

---

## Cookies

| Name | When set | HttpOnly | Purpose |
|------|-----------|----------|---------|
| NextAuth session cookie | Successful credentials sign-in | Yes (typical) | Encrypted JWT with `sub` (HRID) + email |
| `ho_email_verify` | Register / resume verify | Yes | Pending email verification session |

---

## Server logs (Vercel)

**Isolation routes (no heavy auth on `ping`):**

1. `GET https://<your-host>/api/ping` or `/api/auth/ping` → should return `{ ok: true, … }` if configured in the repo.

Set **`REGISTRATION_DEBUG_AUTH=1`** for extra **`[auth-backend]`** logs on AdminSite calls from `lib/auth-backend.ts`.

---

## Failure modes (debugging)

| Symptom | Check |
|--------|--------|
| `CredentialsSignin` / wrong password | Generic failure from `authorize` returning `null` |
| `code: EMAIL_NOT_VERIFIED` (client) | Thrown from `authorize` when HAMS returns 403 + that code |
| Missing session on `/signedin` | `AUTH_SECRET` / `AUTH_URL` on Vercel; cookie domain / HTTPS |
| 500 on NextAuth routes | Vercel logs for `[auth]` / stack traces |

If **mark-email-verified** works but **login** fails with 401/403 from HAMS, compare **HAMS_API_KEY** on AdminSite with a valid key in HAMS.

---

## Security notes (demo scope)

- **`/signedin`** shows **session user id + email** from NextAuth. **`GET /api/me`** returns the same account JSON for this origin — not a raw HAMS bearer token.
- Production games that need HAMS APIs should obtain tokens on a trusted backend or use a dedicated token strategy; do not assume this demo session is a HAMS bearer token.
- `ADMINSITE_AUTH_BASE_URL` must be **HTTPS** in production if the site is HTTPS.

---

## Related files

- `auth.ts` — NextAuth config + Credentials `authorize`  
- `app/api/auth/[...nextauth]/route.ts` — NextAuth handlers  
- `lib/auth-backend.ts` — `authBackendPost` to AdminSite  
- `lib/auth-session-cookies.ts` — `coerceLoginTokens`, verification cookie helpers  
- `lib/client-sign-in-credentials.ts` — Client `signIn("credentials")`  
- `lib/client-login-after-verify.ts` — After verify, `signIn` + `getSession`  
- `AdminSite/app/api/auth/login/route.ts` — Forwards to HAMS  
