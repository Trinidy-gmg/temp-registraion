# RegistrationPage

Minimal **Next.js** app with **sign-in** (`/`) and a **multi-step sign-up** flow (`/signup`). Server routes call **AdminSite** `POST /api/auth/login`, `POST /api/auth/register`, and `POST /api/auth/mark-email-verified`, which forward to **HAMS** with the API key kept on AdminSite.

After **register**, the user must enter an **8-digit code** emailed via **SendGrid**; then the app marks the email verified and sets sign-in cookies. **Abandoned sign-ups:** sign in with email + password — if HAMS returns `EMAIL_NOT_VERIFIED`, use **Email me a verification code** and complete the same code step.

**Look & feel:** Typography and colors match [hollowedoath.com](https://hollowedoath.com) (Cinzel + Outfit, gold `#F0BA19`, dark theme) using the same hero poster asset as the main site. The `/press-kit` path was not reachable from our checks (404); when it’s live, you can add a direct link.

## Local dev

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment (server-only)

Copy `.env.example` to `.env.local` for local dev:

| Variable | Description |
|----------|-------------|
| `ADMINSITE_AUTH_BASE_URL` | Public base URL of **AdminSite** (no trailing slash). Calls `{base}/api/auth/login`, `register`, and `mark-email-verified`. |
| `SIGNUP_VERIFY_SECRET` | Min 16 characters; signs the pending-verification httpOnly cookie. |
| `REGISTRATION_VERIFY_SECRET` | Same value as on **AdminSite**; protects `mark-email-verified`. |
| `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME` | Send the verification code email. |
| `SENDGRID_VERIFICATION_TEMPLATE_ID` | Optional SendGrid dynamic template ID; HTML source: `templates/sendgrid/verification-code.html`. |

**AdminSite** must have `HAMS_API_URL`, `HAMS_API_KEY`, `REGISTRATION_VERIFY_SECRET` (required in production for mark-verified), and optionally `HAMS_TERMS_VERSION` (see `ENV-VARIABLES-LIST.md`).

On **Vercel** (RegistrationPage), set `ADMINSITE_AUTH_BASE_URL` in Project → Settings → Environment Variables.

After sign-in, **access** and **refresh** tokens are stored in **httpOnly** cookies (`ho_access_token`, `ho_refresh_token`).

### Demo terms gate

- **`/`** — Sign in only, with a **Create an account** link to **`/signup`**.
- **`/signup`** — Wizard: welcome → demo terms (scroll to bottom) → account → **email verification (8-digit code)** → success (signed in). Visiting **`/signup?from=terms`** jumps to the account step only if **`/terms`** already set the scroll ack in `localStorage` (`ho_terms_scroll_ack_v1`).
- **`/terms`** — Standalone terms page with the same lorem content; **Continue** sets the ack and sends users to **`/signup?from=terms`** (or a safe same-origin `?next=` path if you pass one). Sign-in is not gated.

## Free hosting

These work well for a small Next.js app:

| Host | Notes |
|------|--------|
| **[Vercel](https://vercel.com)** | Connect the GitHub repo; zero config for Next.js; free hobby tier. |
| **[Cloudflare Pages](https://pages.cloudflare.com)** | Connect repo; use Next.js preset / framework detection. |
| **[Netlify](https://www.netlify.com)** | Connect repo; Next.js runtime on free tier. |

**Suggested flow:** Create a GitHub repo named `RegistrationPage`, push this folder, then import the repo in Vercel (fastest path for Next.js).

## Repo / folder name

The npm package name is `registration-page` (lowercase; npm rules). The folder and Git repo can stay **`RegistrationPage`** as you prefer.
