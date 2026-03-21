# RegistrationPage — authentication flow (in depth)

This document describes **how sign-in works** in the Hollowed Oath **RegistrationPage** (Next.js on Vercel), **which services are called**, **what secrets apply where**, and **how cookies and APIs fit together**.

---

## High-level architecture

```
Browser (RegistrationPage on Vercel)
    │
    │  POST /api/auth/login  (same-origin, JSON body)
    ▼
RegistrationPage server route  app/api/auth/login/route.ts
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

**Important:** RegistrationPage **never** holds `HAMS_API_KEY`. Only **AdminSite** (and your HAMS deployment) does. RegistrationPage only needs **`ADMINSITE_AUTH_BASE_URL`** pointing at the **public origin** of AdminSite (e.g. `https://admin-nightly.example.com`, no trailing slash).

---

## Environment variables (who needs what)

### RegistrationPage (Vercel)

| Variable | Used for |
|----------|-----------|
| `ADMINSITE_AUTH_BASE_URL` | Server-side calls to AdminSite: `/api/auth/login`, `/api/auth/register`, `/api/auth/mark-email-verified` |
| `REGISTRATION_VERIFY_SECRET` | Header `X-Registration-Verify-Secret` when calling **mark-email-verified** only (must match AdminSite) |
| `SIGNUP_VERIFY_SECRET` | Signing the httpOnly `ho_email_verify` cookie (8-digit code flow) |
| SendGrid vars | Sending verification email |

**Login does not use** `REGISTRATION_VERIFY_SECRET` or `SIGNUP_VERIFY_SECRET`.

### AdminSite (K8s / Docker / etc.)

| Variable | Used for |
|----------|-----------|
| `HAMS_API_URL` | Base URL for HAMS (e.g. internal `http://hams:3000` or public URL) |
| `HAMS_API_KEY` | Sent as `X-API-Key` on every forward to HAMS for login, register, mark-verified, etc. |
| `REGISTRATION_VERIFY_SECRET` | Validates `POST /api/auth/mark-email-verified` in production |

### HAMS

| Variable | Role |
|----------|------|
| API key in DB | Must match `HAMS_API_KEY` when `REQUIRE_API_KEY` is enabled |
| JWT keys | Issues `access_token` / `refresh_token` on successful login |

---

## End-to-end: successful sign-in from the home page

1. **User** submits email + password on `/` (`SignInForm`).
2. **Browser** sends:
   - `POST /api/auth/login`
   - `credentials: "same-origin"` (required so **Set-Cookie** from the response is stored).
3. **RegistrationPage** `login/route.ts`:
   - Validates body.
   - Calls AdminSite: `POST {base}/api/auth/login` with `{ email, password }`.
4. **AdminSite** forwards to HAMS: `POST {HAMS_API_URL}/login` with `X-API-Key`.
5. **HAMS** validates password, checks `email_verified`, returns JSON like:
   ```json
   {
     "access_token": "<JWT>",
     "refresh_token": "<opaque or JWT per HAMS>",
     "expires_in": 900,
     "token_type": "Bearer",
     "account_id": "<HRID>"
   }
   ```
6. **AdminSite** returns that JSON (same status as HAMS, typically 200).
7. **RegistrationPage**:
   - Coerces shape via `coerceLoginTokens()` (snake_case / camelCase / optional `{ data: … }` wrapper).
   - Sets **httpOnly** cookies by **`res.headers.append("Set-Cookie", …)`** twice (`jsonWithAuthCookiesHeaders`) — avoids Vercel/Next 16 issues seen with both `NextResponse.cookies.set` and `cookies().set` in Route Handlers.
   - Returns `NextResponse.json({ ok: true, account_id, token_type })` (no tokens in JSON).
   - Cookie names: `ho_access_token`, `ho_refresh_token`.
8. **Browser** follows redirect or UI navigation to **`/logged-in`** (after this change).
9. **`/logged-in`** (server):
   - Reads `ho_access_token` via `cookies()`.
   - If missing → redirect to `/`.
   - Optionally decodes JWT **payload only** (no signature verify) to show `sub` (account HRID) and `email` for demo UI.

---

## Email verification + sign-in (signup flow)

1. **Register:** `POST /api/auth/register` → AdminSite → HAMS `POST /register`.
2. **Verification email** sent (SendGrid); **signed cookie** `ho_email_verify` stores hashed code + `aid` + email.
3. **Confirm code:** `POST /api/auth/verification/confirm` with `{ code }`:
   - Validates cookie + code.
   - `POST` AdminSite `mark-email-verified` (with `X-Registration-Verify-Secret` if configured).
   - Clears `ho_email_verify`.
4. **Browser** then calls **`POST /api/auth/login`** again (same as normal login) via `fetchLoginAfterVerification()` in `lib/client-login-after-verify.ts` (retries once on `EMAIL_NOT_VERIFIED`).
5. Cookies set as above → redirect **`/logged-in`**.

---

## API reference (RegistrationPage)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/auth/login` | Email/password → HAMS via AdminSite → sets auth cookies |
| `POST` | `/api/auth/register` | Create account (terms/version injected server-side on AdminSite) |
| `POST` | `/api/auth/verification/confirm` | Validate 8-digit code + mark verified; **does not** set auth cookies |
| `POST` | `/api/auth/verification/resend` | New code (cookie session) |
| `POST` | `/api/auth/verification/resume` | Login attempt; if unverified, send code path |
| `GET` | `/api/auth/session` | JSON: `{ authenticated, account_id?, email? }` (demo; JWT payload decode) |
| `POST` | `/api/auth/logout` | Clears `ho_access_token` and `ho_refresh_token` |

---

## Cookies

| Name | When set | HttpOnly | Purpose |
|------|-----------|----------|---------|
| `ho_access_token` | Successful login | Yes | HAMS access JWT |
| `ho_refresh_token` | Successful login | Yes | Refresh token |
| `ho_email_verify` | Register / resume verify | Yes | Pending email verification session |

All use `path: /`, `sameSite: lax`, `secure` in production.

---

## Server logs (Vercel)

**Is the bug client or server?** A normal sign-in request is `POST /api/auth/login` with `Content-Type: application/json`, body `{ email, password, keepMeSignedIn }`, and `credentials: "include"` (or `same-origin`). **If you get HTTP 500, the failure is on the server** (or Vercel routing to the wrong deployment). You **do not** receive JWTs in the JSON body on success — they arrive as **`Set-Cookie`** (`ho_access_token`, `ho_refresh_token`). Until status is **200** and those cookies appear, you are **not** logged in.

**Isolation routes (no app auth libs on `ping`):**

1. `GET https://<your-host>/api/ping` (short) or `/api/auth/ping` → should return `{ ok: true, node: "v…", gitSha: "…" }`.
   - **404 Not Found** means this deployment was **not built from a commit that contains these routes**, or Vercel **Root Directory** is wrong (must be the folder that contains your Next `app/` directory — for this repo, usually **`.`** at the repo root, not a parent monorepo folder).
   - Merge `feature/email-verification-flow` into the branch Vercel **Production** uses, or point the Preview deployment at that branch, then redeploy.
2. `GET https://<your-host>/api/auth/login` → proves the login segment loads.
3. `POST /api/ping` or `POST /api/auth/ping` with the same JSON as login → proves body parsing works (returns `bodyBytes`).

Response includes **`gitSha`** (from `VERCEL_GIT_COMMIT_SHA`) so you can confirm the live build matches GitHub.

**After deploy:** every `POST /api/auth/login` response includes:

- **`x-login-req-id`** — correlate with Vercel logs.
- **`x-login-stage`** — where the handler stopped, e.g. `upstream_error` (AdminSite/HAMS failed), `ok` (cookies sent), `headers_too_large` (Set-Cookie bytes exceeded proxy limit), `session_cookie_error`, `fatal`.
- **`x-adminsite-status`** — when `x-login-stage` is `upstream_error`, the HTTP status from AdminSite (e.g. `401`, `500`).

If **`x-login-stage: upstream_error`** and **`x-adminsite-status: 500`**, fix **AdminSite → HAMS** (not the RegistrationPage form). Two full JWTs in `Set-Cookie` can exceed **~8KB total response headers** on some hosts; then the edge returns a **generic 500** with no JSON — see **`LOGIN_COOKIE_HEADERS_TOO_LARGE`** / env **`REGISTRATION_MAX_SET_COOKIE_BYTES`** (default `7500`).

**Debug:** set **`REGISTRATION_SKIP_AUTH_COOKIES=1`** on Vercel to return **200** without cookies — confirms RegistrationPage + AdminSite + token JSON shape. Remove after testing.

If dynamic import of auth modules fails, body is `{ code: "LOGIN_LOAD_FAILED", hint: "…" }`.

**Import chain:** `app/api/auth/login` must not load `email-verify-session.ts` (it pulls Node `crypto`). Cookie names live in **`lib/ho-cookie-names.ts`**; `auth-session-cookies.ts` imports from there so login stays lightweight.

Every `POST /api/auth/login` emits **`[auth/login]`** lines: `start`, `body_ok` (email domain hint only — **never** the password), `ADMINSITE configured`, `AdminSite response`, `setting cookies` (token **lengths** only), `success`, or errors.

Set **`REGISTRATION_DEBUG_AUTH=1`** on the Vercel project for extra **`[auth-backend]`** logs (`fetch_start` / `fetch_done` with status, `content-type`, response body length, top-level JSON keys).

`lib/auth-backend.ts` reads AdminSite responses with **`res.text()`** then parses JSON so HTML error pages (e.g. 502 gateway) don’t crash the parser and show up as `ADMIN_SITE_NON_JSON` with a short `bodyPreview` in logs.

---

## Failure modes (debugging)

Inspect the **response body** of failing `POST /api/auth/login` (Network tab):

| `code` | Meaning |
|--------|---------|
| `AUTH_BACKEND_NOT_CONFIGURED` | Missing `ADMINSITE_AUTH_BASE_URL` on Vercel |
| `EMAIL_NOT_VERIFIED` | HAMS blocks login until email verified |
| `LOGIN_INCOMPLETE` | Success path but JSON missing tokens / `account_id` (shape mismatch) |
| `LOGIN_TOKEN_TOO_LARGE` | JWT too big for ~4KB cookie |
| `SESSION_COOKIE_ERROR` | `Set-Cookie` failed — see `hint` |
| `LOGIN_FATAL` | Unexpected error — see Vercel logs `[auth/login]` |

If **mark-email-verified** works but **login** fails with 401/403 from HAMS, compare **HAMS_API_KEY** on AdminSite with a valid key in HAMS (and that `POST /login` is allowed with that key).

---

## Security notes (demo scope)

- JWT payload on `/logged-in` is decoded **without** signature verification **for display only**. Do not use that decode to authorize sensitive actions.
- Production games should validate JWTs against HAMS public key or introspect on a trusted backend.
- `ADMINSITE_AUTH_BASE_URL` must be **HTTPS** in production if the site is HTTPS (avoid mixed content / cookie issues).

---

## Related files

- `app/api/auth/login/route.ts` — BFF login + cookie setter  
- `lib/auth-backend.ts` — `authBackendPost` to AdminSite  
- `lib/auth-session-cookies.ts` — `coerceLoginTokens`, `jsonWithAuthCookies`  
- `lib/client-login-after-verify.ts` — Browser helper after verify  
- `AdminSite/lib/hams-auth-forward.ts` — `postToHams`  
- `AdminSite/app/api/auth/login/route.ts` — Forwards to HAMS  
