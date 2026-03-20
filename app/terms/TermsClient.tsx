"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TermsLoremArticle } from "@/app/components/TermsLoremArticle";
import { useScrollNearBottom } from "@/hooks/use-scroll-near-bottom";
import { setTermsScrollAck } from "@/lib/terms-ack";

export function TermsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const atBottom = useScrollNearBottom(72);

  function handleContinue() {
    if (!atBottom) return;
    setTermsScrollAck();
    const safe =
      nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
        ? nextParam
        : "/signup?from=terms";
    router.push(safe);
  }

  return (
    <div className="min-h-svh bg-gradient-to-b from-[hsl(30_8%_10%)] to-[hsl(30_8%_6%)] pb-36 text-white">
      <div className="mx-auto max-w-2xl px-6 py-10 md:py-14">
        <Link
          href="/"
          className="font-[family-name:var(--font-outfit)] text-sm text-[#F0BA19]/90 underline-offset-2 hover:underline"
        >
          ← Back to sign in
        </Link>

        <h1 className="mt-8 font-[family-name:var(--font-cinzel)] text-3xl font-bold tracking-tight text-[#F0BA19] drop-shadow-[0_0_12px_rgba(240,186,25,0.25)] md:text-4xl">
          Demo terms & conditions
        </h1>
        <p className="mt-3 font-[family-name:var(--font-outfit)] text-sm text-white/65">
          This is placeholder text for UI testing only. Scroll to the bottom to continue
          to account creation.
        </p>

        <div className="mt-10">
          <TermsLoremArticle />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[#F0BA19]/30 bg-[hsl(30_8%_8%_/_0.95)] px-4 py-4 backdrop-blur-md md:px-8">
        <div className="mx-auto flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-[family-name:var(--font-outfit)] text-xs text-white/55 sm:text-sm">
            {atBottom ? (
              <span className="text-emerald-300/90">You’ve reached the bottom.</span>
            ) : (
              <span>Scroll to the bottom to unlock “Continue to create account”.</span>
            )}
          </p>
          <button
            type="button"
            disabled={!atBottom}
            onClick={handleContinue}
            className="shrink-0 rounded-md border border-[#F0BA19]/50 bg-[#F0BA19]/15 px-6 py-3 font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#F0BA19] shadow-[0_0_12px_rgba(240,186,25,0.2)] transition hover:border-[#F0BA19] hover:bg-[#F0BA19]/25 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#F0BA19]/15"
          >
            Continue to create account
          </button>
        </div>
      </div>
    </div>
  );
}
