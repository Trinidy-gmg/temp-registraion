import Image from "next/image";
import Link from "next/link";
import { LoginPanel } from "./components/LoginPanel";

const HERO_POSTER = "https://hollowedoath.com/videos/hero-poster.jpg";

export default function Home() {
  return (
    <div className="relative flex min-h-svh flex-col">
      {/* Hero art — same asset as hollowedoath.com OG / hero */}
      <div className="absolute inset-0 z-0">
        <Image
          src={HERO_POSTER}
          alt="Hollowed Oath — heroic fantasy MMORPG"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/55 to-[hsl(30_8%_8%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[hsl(30_8%_8%)] via-transparent to-transparent opacity-90"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_hsl(30_8%_8%_/_0.65)_100%)]"
          aria-hidden
        />
      </div>

      <header className="relative z-10 flex justify-center px-6 pt-8 md:pt-10">
        <Link
          href="https://hollowedoath.com/"
          className="font-[family-name:var(--font-cinzel)] text-sm font-semibold tracking-[0.35em] text-[#F0BA19] drop-shadow-[0_0_12px_rgba(240,186,25,0.4)] transition-opacity hover:opacity-90"
        >
          HOLLOWED OATH
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-6 text-center md:px-10">
        <p className="font-[family-name:var(--font-outfit)] text-xs font-medium uppercase tracking-[0.2em] text-[#F0BA19]/85">
          God Mode Games
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-cinzel)] text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] sm:text-4xl md:text-5xl">
          Sign in
        </h1>
        <p className="mt-3 max-w-md font-[family-name:var(--font-outfit)] text-sm leading-relaxed text-white/75 md:text-base">
          Welcome back, Oathsworn. Enter your credentials to continue — authentication
          will be connected in a later update.
        </p>

        <div className="mt-8 w-full flex justify-center">
          <LoginPanel />
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-5">
          <Link
            href="https://hollowedoath.com/"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#F0BA19]/50 bg-[#F0BA19]/10 px-8 py-2.5 font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#F0BA19] shadow-[0_0_12px_rgba(240,186,25,0.25)] transition hover:border-[#F0BA19] hover:bg-[#F0BA19]/20 hover:shadow-[0_0_20px_rgba(240,186,25,0.45)]"
          >
            Official site
          </Link>
          <Link
            href="https://discord.gg/hollowedoath"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/20 bg-black/30 px-8 py-2.5 font-[family-name:var(--font-outfit)] text-sm font-medium text-white/90 backdrop-blur-sm transition hover:border-white/35 hover:bg-black/45"
          >
            Discord
          </Link>
        </div>
      </main>

      <footer className="relative z-10 px-6 pb-8 text-center">
        <p className="font-[family-name:var(--font-outfit)] text-xs text-white/45">
          © {new Date().getFullYear()} God Mode Games ·{" "}
          <Link
            href="https://hollowedoath.com/"
            className="underline-offset-2 hover:text-white/70 hover:underline"
          >
            hollowedoath.com
          </Link>
        </p>
      </footer>
    </div>
  );
}
