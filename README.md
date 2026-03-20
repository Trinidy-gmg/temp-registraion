# RegistrationPage

Minimal **Next.js** app with **sign-in** and **sign-up** against **HAMS** (`POST /login`, `POST /register`). The browser never sees your HAMS API key — only server routes call HAMS with `HAMS_API_KEY`.

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
| `HAMS_API_URL` | HAMS base URL (no trailing slash), e.g. `http://localhost:3000` |
| `HAMS_API_KEY` | Valid HAMS API key (`X-API-Key`) |
| `HAMS_TERMS_VERSION` | Optional; sent as `terms_version` on register (default `1.0`) |

On **Vercel**, add the same variables in Project → Settings → Environment Variables.

After sign-in, **access** and **refresh** tokens are stored in **httpOnly** cookies (`ho_access_token`, `ho_refresh_token`).

### Demo terms gate

**`/terms`** shows placeholder (lorem ipsum) text. Users must **scroll to the bottom** before **Continue to create account** enables. That sets `localStorage` (`ho_terms_scroll_ack_v1`) so the **Create account** tab and form can be used. Sign-in is not gated.

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
