# RegistrationPage

Minimal **Next.js** app with **sign-in** (`/`) and a **multi-step sign-up** flow (`/signup`). Server routes call **AdminSite** `POST /api/auth/login` and `POST /api/auth/register`, which forward to **HAMS** with the API key kept on AdminSite. You only configure **`ADMINSITE_AUTH_BASE_URL`** on RegistrationPage (demo setup).

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
| `ADMINSITE_AUTH_BASE_URL` | Public base URL of **AdminSite** (no trailing slash), e.g. `https://admin.example.com` or `http://localhost:3020`. RegistrationPage calls `{base}/api/auth/login` and `{base}/api/auth/register`. |

**AdminSite** must have `HAMS_API_URL`, `HAMS_API_KEY`, and optionally `HAMS_TERMS_VERSION` so those routes can reach HAMS (see `ENV-VARIABLES-LIST.md` in the monorepo).

On **Vercel** (RegistrationPage), set `ADMINSITE_AUTH_BASE_URL` in Project → Settings → Environment Variables.

After sign-in, **access** and **refresh** tokens are stored in **httpOnly** cookies (`ho_access_token`, `ho_refresh_token`).

### Demo terms gate

- **`/`** — Sign in only, with a **Create an account** link to **`/signup`**.
- **`/signup`** — Wizard: welcome → read demo terms (scroll page to bottom) → account (email / password / confirm, optional “keep me signed in”) → success. Visiting **`/signup?from=terms`** jumps to the account step only if **`/terms`** (or the flow’s terms step) already set the scroll ack in `localStorage` (`ho_terms_scroll_ack_v1`).
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
