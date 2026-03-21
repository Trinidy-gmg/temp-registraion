import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroBackdrop } from "@/app/components/HeroBackdrop";
import { SignInForm } from "@/app/components/SignInForm";
import { LoginReasonBanner } from "./LoginReasonBanner";

export const metadata: Metadata = {
  title: "Hollowed Oath — Sign in",
  description:
    "Sign in to your Hollowed Oath account — heroic fantasy MMORPG.",
};

export default function LoginPage() {
  return (
    <HeroBackdrop>
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-12 text-center sm:pt-16 md:px-10">
        <p className="font-[family-name:var(--font-outfit)] text-xs uppercase tracking-wider text-[#F0BA19]/80">
          Hollowed Oath
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-cinzel)] text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] sm:text-4xl md:text-5xl">
          Sign in
        </h1>
        <Suspense fallback={null}>
          <LoginReasonBanner />
        </Suspense>

        <p className="mt-3 max-w-lg font-[family-name:var(--font-outfit)] text-sm leading-relaxed text-white/75 md:text-base">
          Enter the email and password for your Hollowed Oath account. We&apos;ll
          verify them securely, then bring you to your account overview.
        </p>

        <div className="mt-8 flex w-full justify-center">
          <SignInForm />
        </div>

        <p className="mt-10 font-[family-name:var(--font-outfit)] text-sm text-white/50">
          <Link href="/" className="text-[#F0BA19] underline-offset-2 hover:underline">
            Home
          </Link>
          {" · "}
          <Link href="/signup" className="text-[#F0BA19] underline-offset-2 hover:underline">
            Create an account
          </Link>
        </p>
      </main>
    </HeroBackdrop>
  );
}
