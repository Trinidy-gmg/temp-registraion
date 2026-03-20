import Image from "next/image";
import { Suspense } from "react";
import { AuthCard } from "./components/AuthCard";

const HERO_POSTER = "https://hollowedoath.com/videos/hero-poster.jpg";

export default function Home() {
  return (
    <div className="relative flex min-h-svh flex-col">
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

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-12 text-center sm:pt-16 md:px-10">
        <h1 className="font-[family-name:var(--font-cinzel)] text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] sm:text-4xl md:text-5xl">
          Welcome
        </h1>
        <p className="mt-3 max-w-md font-[family-name:var(--font-outfit)] text-sm leading-relaxed text-white/75 md:text-base">
          Welcome back, Oathsworn — or create an account. New accounts require reading
          the demo terms first. Your session is stored securely when you sign in.
        </p>

        <div className="mt-8 w-full flex justify-center">
          <Suspense
            fallback={
              <div className="h-[28rem] w-full max-w-md animate-pulse rounded-xl border border-[#F0BA19]/20 bg-black/20" />
            }
          >
            <AuthCard />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
