import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { HeroBackdrop } from "@/app/components/HeroBackdrop";
import { LoggedInActions } from "@/app/logged-in/LoggedInActions";
import { ACCESS_COOKIE } from "@/lib/auth-session-cookies";
import { decodeJwtPayloadUnsafe } from "@/lib/decode-jwt-payload";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hollowed Oath — Signed in",
  description: "You are signed in to the Hollowed Oath registration demo.",
};

export const dynamic = "force-dynamic";

export default async function LoggedInPage() {
  const jar = await cookies();
  const token = jar.get(ACCESS_COOKIE)?.value?.trim();
  if (!token) {
    redirect("/?reason=not_signed_in");
  }

  const payload = decodeJwtPayloadUnsafe(token);
  const accountId = typeof payload?.sub === "string" ? payload.sub : null;
  const email = typeof payload?.email === "string" ? payload.email : null;

  return (
    <HeroBackdrop>
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-12 text-center sm:pt-16 md:px-10">
        <h1 className="font-[family-name:var(--font-cinzel)] text-3xl font-bold leading-tight tracking-tight text-emerald-100 drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] sm:text-4xl md:text-5xl">
          You&apos;re signed in
        </h1>
        <p className="mt-3 max-w-lg font-[family-name:var(--font-outfit)] text-sm leading-relaxed text-white/75 md:text-base">
          Your session is stored in secure cookies on this site. This page confirms the
          registration demo login completed successfully.
        </p>

        <div className="mt-10 w-full max-w-md rounded-xl border border-[#F0BA19]/40 bg-[hsl(30_8%_11%_/_0.82)] px-6 py-7 text-left shadow-[0_0_12px_rgba(240,186,25,0.15)] backdrop-blur-sm md:px-8 md:py-8">
          <h2 className="font-[family-name:var(--font-cinzel)] text-lg font-semibold text-[#F0BA19]">
            Account
          </h2>
          <dl className="mt-4 space-y-3 font-[family-name:var(--font-outfit)] text-sm text-white/85">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-white/45">
                Account ID (HRID)
              </dt>
              <dd className="mt-1 font-mono text-[#F0BA19]/95 break-all">
                {accountId ?? "— (token present; could not read sub claim)"}
              </dd>
            </div>
            {email ? (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-white/45">
                  Email (from access token)
                </dt>
                <dd className="mt-1 break-all text-white/90">{email}</dd>
              </div>
            ) : null}
          </dl>

          <p className="mt-6 font-[family-name:var(--font-outfit)] text-xs leading-relaxed text-white/40">
            Tokens are in httpOnly cookies <code className="text-white/50">ho_access_token</code>{" "}
            and <code className="text-white/50">ho_refresh_token</code>. They are issued by HAMS via
            AdminSite — see <code className="text-white/50">docs/AUTH-FLOW.md</code> in this repo.
          </p>

          <LoggedInActions />
        </div>

        <p className="mt-8 font-[family-name:var(--font-outfit)] text-sm text-white/50">
          <Link href="/" className="text-[#F0BA19] underline-offset-2 hover:underline">
            Back to sign in
          </Link>
          {" · "}
          <Link href="/signup" className="text-[#F0BA19] underline-offset-2 hover:underline">
            Register another (demo)
          </Link>
        </p>
      </main>
    </HeroBackdrop>
  );
}
