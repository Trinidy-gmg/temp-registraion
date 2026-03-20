import type { Metadata } from "next";
import { Suspense } from "react";
import { TermsClient } from "./TermsClient";

export const metadata: Metadata = {
  title: "Demo terms — Hollowed Oath",
  description: "Placeholder terms for account creation flow (demo).",
};

function TermsFallback() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-[hsl(30_8%_8%)] text-white/60">
      <p className="font-[family-name:var(--font-outfit)] text-sm">Loading…</p>
    </div>
  );
}

export default function TermsPage() {
  return (
    <Suspense fallback={<TermsFallback />}>
      <TermsClient />
    </Suspense>
  );
}
