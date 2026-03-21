import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroBackdrop } from "@/app/components/HeroBackdrop";
import { SignInForm } from "@/app/components/SignInForm";
import { LoginReasonBanner } from "./LoginReasonBanner";

export const metadata: Metadata = {
  title: "Hollowed Oath — Log in (demo site)",
  description:
    "Sign in to the Hollowed Oath temp registration demo — your session is on this site only.",
};

export default function LoginPage() {
  return (
    <HeroBackdrop>
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-12 text-center sm:pt-16 md:px-10">
        <p className="font-[family-name:var(--font-outfit)] text-xs uppercase tracking-wider text-[#F0BA19]/80">
          Temp registration demo
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-cinzel)] text-3xl font-bold leading-tight tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] sm:text-4xl md:text-5xl">
          Log in to this site
        </h1>
        <Suspense fallback={null}>
          <LoginReasonBanner />
        </Suspense>

        <p className="mt-3 max-w-lg font-[family-name:var(--font-outfit)] text-sm leading-relaxed text-white/75 md:text-base">
          You are signing into{" "}
          <strong className="text-white/90">this demo website</strong> (the temp
          registration front door). Your password is sent to our account API once
          to verify you; if that succeeds,{" "}
          <strong className="text-white/90">this site</strong> starts a session
          and sends you to <code className="text-[#F0BA19]/90">/signedin</code>.
          That is <em>not</em> the same as logging into AdminSite.
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
