import Link from "next/link";
import { HeroBackdrop } from "./components/HeroBackdrop";

export default function Home() {
  return (
    <HeroBackdrop>
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-12 text-center sm:pt-16 md:px-10">
        <p className="font-[family-name:var(--font-outfit)] text-xs uppercase tracking-wider text-[#F0BA19]/80">
          Hollowed Oath — temp registration demo
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-cinzel)] text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] sm:text-4xl md:text-5xl">
          Welcome
        </h1>
        <p className="mt-3 max-w-md font-[family-name:var(--font-outfit)] text-sm leading-relaxed text-white/75 md:text-base">
          This is a <strong className="text-white/90">faux front door</strong> for
          accounts: a small website where you register or log in. Your session lives
          on <strong className="text-white/90">this site</strong> — not inside
          AdminSite.
        </p>

        <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-md border border-[#F0BA19]/50 bg-[#F0BA19]/15 px-8 py-3.5 font-[family-name:var(--font-outfit)] text-sm font-semibold tracking-wide text-[#F0BA19] shadow-[0_0_12px_rgba(240,186,25,0.2)] transition hover:border-[#F0BA19] hover:bg-[#F0BA19]/25"
          >
            Log in to this site
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-md border border-white/25 bg-black/30 px-8 py-3.5 font-[family-name:var(--font-outfit)] text-sm font-semibold text-white/90 transition hover:bg-white/10"
          >
            Create an account
          </Link>
        </div>

        <p className="mt-8 max-w-md font-[family-name:var(--font-outfit)] text-xs leading-relaxed text-white/40">
          After login you&apos;ll land on <code className="text-white/55">/signedin</code>{" "}
          with your email and account id. Sign out returns you here.
        </p>
      </main>
    </HeroBackdrop>
  );
}
