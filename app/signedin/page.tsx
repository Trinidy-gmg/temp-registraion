import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { HeroBackdrop } from "@/app/components/HeroBackdrop";
import { SignedInActions } from "@/app/signedin/SignedInActions";
import { SiteSessionApiPreview } from "@/app/signedin/SiteSessionApiPreview";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hollowed Oath — Your account",
  description: "Your Hollowed Oath account overview.",
};

export const dynamic = "force-dynamic";

export default async function SignedInPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?reason=not_signed_in");
  }

  const accountId =
    typeof session.user.id === "string" ? session.user.id : null;
  const email =
    typeof session.user.email === "string" ? session.user.email : null;

  return (
    <HeroBackdrop>
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-12 text-center sm:pt-16 md:px-10">
        <p className="font-[family-name:var(--font-outfit)] text-xs uppercase tracking-wider text-emerald-400/90">
          Signed in
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-cinzel)] text-3xl font-bold leading-tight tracking-tight text-emerald-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] sm:text-4xl md:text-5xl">
          Welcome back
        </h1>
        <p className="mt-3 max-w-lg font-[family-name:var(--font-outfit)] text-sm leading-relaxed text-white/75 md:text-base">
          You&apos;re signed in to the Hollowed Oath account portal. Below is the
          account tied to your email — your gateway to characters, realms, and
          everything we connect to this profile.
        </p>

        <div className="mt-10 w-full max-w-md rounded-xl border border-[#F0BA19]/40 bg-[hsl(30_8%_11%_/_0.82)] px-6 py-7 text-left shadow-[0_0_12px_rgba(240,186,25,0.15)] backdrop-blur-sm md:px-8 md:py-8">
          <h2 className="font-[family-name:var(--font-cinzel)] text-lg font-semibold text-[#F0BA19]">
            Your account
          </h2>
          <dl className="mt-4 space-y-3 font-[family-name:var(--font-outfit)] text-sm text-white/85">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-white/45">
                Account ID (HRID)
              </dt>
              <dd className="mt-1 font-mono text-[#F0BA19]/95 break-all">
                {accountId ?? "— (session present; missing id)"}
              </dd>
            </div>
            {email ? (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-white/45">
                  Email
                </dt>
                <dd className="mt-1 break-all text-white/90">{email}</dd>
              </div>
            ) : null}
          </dl>

          <SiteSessionApiPreview />

          <SignedInActions />
        </div>

        <p className="mt-8 font-[family-name:var(--font-outfit)] text-sm text-white/50">
          <Link href="/" className="text-[#F0BA19] underline-offset-2 hover:underline">
            Home
          </Link>
          {" · "}
          <Link href="/signup" className="text-[#F0BA19] underline-offset-2 hover:underline">
            Create another account
          </Link>
        </p>
      </main>
    </HeroBackdrop>
  );
}
