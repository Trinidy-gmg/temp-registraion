import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { HeroBackdrop } from "@/app/components/HeroBackdrop";
import { DiscordLinkSection } from "@/app/signedin/DiscordLinkSection";
import { SignedInActions } from "@/app/signedin/SignedInActions";
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

          {discordLinked ? (
            <p
              className="mt-4 rounded-md border border-emerald-500/40 bg-emerald-950/25 px-3 py-2 font-[family-name:var(--font-outfit)] text-sm text-emerald-100"
              role="status"
            >
              Your Discord account was linked successfully.
            </p>
          ) : null}
          {discordFlowFailed ? (
            <p
              className="mt-4 rounded-md border border-red-500/40 bg-red-950/30 px-3 py-2 font-[family-name:var(--font-outfit)] text-sm text-red-200"
              role="alert"
            >
              {discordErrorMessage(discordErrorReason)}
            </p>
          ) : null}

          <SiteSessionApiPreview />

          <DiscordLinkSection />

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
