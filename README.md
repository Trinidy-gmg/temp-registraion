# RegistrationPage

**Next.js** account portal for **Hollowed Oath**: landing (`/`), **sign-in** (`/login`), signed-in overview (`/signedin`), and **sign-up** (`/signup`) with email verification. Sessions use **NextAuth** (credentials verified against the game account API; see `docs/AUTH-FLOW.md` for architecture).

After **register**, the player enters an **8-digit code** from email; then they sign in to open their portal session. **Abandoned sign-ups:** sign in with email + password — if the account is still unverified, use **Email me a verification code** and complete the same step.

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

After sign-in, **NextAuth** stores an encrypted **httpOnly** session cookie (account id + email on this origin; see `auth.ts`).

### Demo terms gate

- **`/`** — Welcome / entry with links to **`/login`** and **`/signup`**.
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
