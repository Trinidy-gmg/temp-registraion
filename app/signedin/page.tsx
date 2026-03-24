import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { HeroBackdrop } from "@/app/components/HeroBackdrop";
import { AccountDashboard } from "@/app/signedin/AccountDashboard";
import { SiteSessionApiPreview } from "@/app/signedin/SiteSessionApiPreview";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hollowed Oath — Your account",
  description: "Your Hollowed Oath account overview.",
};

export const dynamic = "force-dynamic";

function firstParam(
  v: string | string[] | undefined
): string | undefined {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return undefined;
}

function discordErrorMessage(reason: string | undefined): string {
  switch (reason) {
    case "not_signed_in":
      return "You were signed out before Discord finished. Sign in and try linking again.";
    case "discord_denied":
      return "Discord authorization was cancelled or denied.";
    case "bad_callback":
      return "The Discord callback was incomplete. Please try linking again.";
    case "not_configured":
      return "Discord linking is not available on the server right now.";
    case "missing_token":
      return "Your login session needs a fresh token. Sign out, sign in again, then link Discord.";
    case "ALREADY_LINKED":
      return "This Discord account is already linked to a Hollowed Oath profile.";
    case "INVALID_STATE":
      return "This Discord link attempt expired or was already used. Try “Link Discord account” again.";
    default:
      return reason
        ? `Discord linking did not complete (${reason}). Please try again.`
        : "Discord linking did not complete. Please try again.";
  }
}

export default async function SignedInPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?reason=not_signed_in");
  }

  const sp = searchParams ? await searchParams : {};
  const discordParam = firstParam(sp.discord);
  const discordLinked = discordParam === "linked";
  const discordFlowFailed = discordParam === "error";
  const discordErrorReason = discordFlowFailed
    ? firstParam(sp.reason)
    : undefined;

  const accountId =
    typeof session.user.id === "string" ? session.user.id : "";
  const email =
    typeof session.user.email === "string" ? session.user.email : null;

  const showApiDebug = process.env.REGISTRATION_DEBUG_ACCOUNT === "1";

  return (
    <HeroBackdrop>
      <main className="relative z-10 flex min-h-svh flex-1 flex-col px-4 pb-16 pt-10 sm:px-8 sm:pt-14 md:px-12">
        <div className="mx-auto w-full max-w-4xl">
          {discordLinked ? (
            <div
              className="mb-6 rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-3 text-center font-[family-name:var(--font-outfit)] text-sm text-emerald-100 shadow-[0_0_24px_rgba(16,185,129,0.12)] sm:text-left"
              role="status"
            >
              Your Discord account was linked successfully.
            </div>
          ) : null}
          {discordFlowFailed ? (
            <div
              className="mb-6 rounded-xl border border-red-500/40 bg-red-950/35 px-4 py-3 text-center font-[family-name:var(--font-outfit)] text-sm text-red-100 sm:text-left"
              role="alert"
            >
              {discordErrorMessage(discordErrorReason)}
            </div>
          ) : null}

          <AccountDashboard sessionAccountId={accountId} sessionEmail={email} />

          {showApiDebug ? (
            <div className="mt-10 border-t border-white/10 pt-8">
              <p className="mb-3 font-[family-name:var(--font-outfit)] text-[10px] font-semibold uppercase tracking-widest text-white/35">
                Operator debug
              </p>
              <SiteSessionApiPreview />
            </div>
          ) : null}

          <p className="mt-10 text-center font-[family-name:var(--font-outfit)] text-[11px] text-white/35">
            Hollowed Oath — a heroic fantasy MMORPG from{" "}
            <a
              href="https://hollowedoath.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#F0BA19]/80 underline-offset-2 hover:underline"
            >
              God Mode Games
            </a>
            .{" "}
            <Link href="/terms" className="text-white/45 underline-offset-2 hover:underline">
              Terms
            </Link>
          </p>
        </div>
      </main>
    </HeroBackdrop>
  );
}
