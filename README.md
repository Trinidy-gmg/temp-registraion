# RegistrationPage

Minimal **Next.js** landing page for demoing Hollowed Oath account registration (form and HAMS wiring can be added later).

**Look & feel:** Typography and colors match [hollowedoath.com](https://hollowedoath.com) (Cinzel + Outfit, gold `#F0BA19`, dark theme) using the same hero poster asset as the main site. The `/press-kit` path was not reachable from our checks (404); when it’s live, you can add a direct link.

## Local dev

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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
