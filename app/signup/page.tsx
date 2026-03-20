import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroBackdrop } from "@/app/components/HeroBackdrop";
import { SignupFlow } from "./SignupFlow";

export const metadata: Metadata = {
  title: "Sign up — Hollowed Oath",
  description: "Create a Hollowed Oath account (demo terms, then credentials).",
};

export default function SignupPage() {
  return (
    <HeroBackdrop>
      <main className="relative z-10 flex flex-1 flex-col items-center px-6 pb-24 pt-12 sm:pt-16 md:px-10">
        <div className="mb-8 w-full max-w-lg text-center">
          <h1 className="font-[family-name:var(--font-cinzel)] text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] sm:text-4xl">
            Sign up
          </h1>
          <p className="mt-3 font-[family-name:var(--font-outfit)] text-sm text-white/70 md:text-base">
            Create your Hollowed Oath account.
          </p>
        </div>

        <Suspense
          fallback={
            <div className="h-96 w-full max-w-lg animate-pulse rounded-xl border border-[#F0BA19]/20 bg-black/20" />
          }
        >
          <SignupFlow />
        </Suspense>
      </main>
    </HeroBackdrop>
  );
}
