"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DiscordLinkSection } from "@/app/signedin/DiscordLinkSection";
import { PasswordSecuritySection } from "@/app/signedin/PasswordSecuritySection";
import { SignedInActions } from "@/app/signedin/SignedInActions";

type MeProfile = {
  account_status?: string;
  email_verified?: boolean;
  kickstarter_backer?: boolean;
  kickstarter_tier?: number | null;
  locked_until?: string | null;
  lock_reason?: string | null;
  last_login_at?: string | null;
  created_at?: string;
  oauth_links?: Array<{
    provider?: string;
    external_username?: string | null;
  }>;
};

type MeResponse = {
  authenticated?: boolean;
  user?: { id?: string; email?: string | null };
  profile?: MeProfile | null;
  profile_note?: string | null;
};

function formatWhen(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function StatusBadge({ status }: { status: string | undefined }) {
  const s = (status || "unknown").toLowerCase();
  if (s === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/45 bg-emerald-950/50 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-emerald-200">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        Active
      </span>
    );
  }
  if (s === "locked") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/45 bg-amber-950/40 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-amber-100">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Locked
      </span>
    );
  }
  if (s === "disabled") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/45 bg-red-950/40 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-red-100">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
        Disabled
      </span>
    );
  }
  return (
    <span className="rounded-full border border-white/20 bg-black/30 px-2.5 py-0.5 text-xs font-medium text-white/70">
      {status || "Unknown"}
    </span>
  );
}

export function AccountDashboard({
  sessionAccountId,
  sessionEmail,
}: {
  sessionAccountId: string;
  sessionEmail: string | null;
}) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/me", { credentials: "same-origin", cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as MeResponse;
      setMe(data);
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const profile = me?.profile;
  const discordFromProfile = profile?.oauth_links?.find(
    (l) => l.provider === "discord"
  );
  const showSupporterCard =
    !loading && profile?.kickstarter_backer === true;

  return (
    <div className="w-full max-w-4xl space-y-8">
      {/* Title band */}
      <header className="text-center md:text-left">
        <div className="mx-auto flex h-px max-w-xs bg-gradient-to-r from-transparent via-[#F0BA19]/60 to-transparent md:mx-0 md:max-w-md" />
        <p className="mt-5 font-[family-name:var(--font-outfit)] text-[11px] font-semibold uppercase tracking-[0.35em] text-[#F0BA19]/90">
          Oathsworn portal
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-cinzel)] text-3xl font-bold tracking-tight text-[#f4e9d8] drop-shadow-[0_2px_12px_rgba(0,0,0,0.75)] sm:text-4xl">
          Your account
        </h1>
        <p className="mx-auto mt-3 max-w-2xl font-[family-name:var(--font-outfit)] text-sm leading-relaxed text-white/70 md:mx-0">
          Every journey matters in Orrathis. This profile ties your email and linked services to
          the characters and worlds we&apos;ll connect here.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Primary identity */}
        <section className="relative overflow-hidden rounded-2xl border border-[#F0BA19]/35 bg-[hsl(30_10%_8%/0.88)] p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.4),0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-md lg:col-span-2">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#F0BA19]/10 blur-3xl"
            aria-hidden
          />
          <h2 className="font-[family-name:var(--font-cinzel)] text-lg font-semibold text-[#F0BA19]">
            Identity
          </h2>
          <p className="mt-1 font-[family-name:var(--font-outfit)] text-xs text-white/50">
            Human-readable ID (HRID) and sign-in email
          </p>

          <dl className="mt-6 space-y-5">
            <div>
              <dt className="font-[family-name:var(--font-outfit)] text-[10px] font-semibold uppercase tracking-widest text-white/40">
                Account ID
              </dt>
              <dd className="mt-1.5 break-all font-mono text-sm font-medium tracking-tight text-[#F0BA19] sm:text-base">
                {sessionAccountId}
              </dd>
            </div>
            <div>
              <dt className="font-[family-name:var(--font-outfit)] text-[10px] font-semibold uppercase tracking-widest text-white/40">
                Email
              </dt>
              <dd className="mt-1.5 break-all font-[family-name:var(--font-outfit)] text-sm text-white/90 sm:text-base">
                {sessionEmail ?? "—"}
              </dd>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div>
                <dt className="font-[family-name:var(--font-outfit)] text-[10px] font-semibold uppercase tracking-widest text-white/40">
                  Account status
                </dt>
                <dd className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={profile?.account_status} />
                  {loading ? (
                    <span className="text-xs text-white/40">Syncing…</span>
                  ) : null}
                </dd>
              </div>
              {profile?.email_verified === false ? (
                <span className="rounded-md border border-amber-500/35 bg-amber-950/30 px-2 py-1 text-[11px] text-amber-100">
                  Email not verified
                </span>
              ) : profile?.email_verified === true ? (
                <span className="rounded-md border border-emerald-500/30 bg-emerald-950/25 px-2 py-1 text-[11px] text-emerald-100/90">
                  Email verified
                </span>
              ) : null}
            </div>
          </dl>

          {me?.profile_note ? (
            <p
              className="mt-5 rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2.5 font-[family-name:var(--font-outfit)] text-xs leading-relaxed text-amber-100/90"
              role="status"
            >
              {me.profile_note}
            </p>
          ) : null}

          {profile?.account_status === "locked" ||
          (profile?.locked_until &&
            new Date(profile.locked_until) > new Date()) ? (
            <div
              className="mt-4 rounded-lg border border-amber-500/40 bg-black/35 px-3 py-2.5 font-[family-name:var(--font-outfit)] text-xs text-amber-50/95"
              role="alert"
            >
              <p className="font-semibold text-amber-200">Account lock</p>
              {profile.lock_reason ? (
                <p className="mt-1 text-white/80">{profile.lock_reason}</p>
              ) : null}
              {formatWhen(profile.locked_until) ? (
                <p className="mt-1 text-white/55">
                  Until: {formatWhen(profile.locked_until)}
                </p>
              ) : null}
            </div>
          ) : null}

          {profile?.account_status === "disabled" ? (
            <div
              className="mt-4 rounded-lg border border-red-500/40 bg-red-950/25 px-3 py-2.5 font-[family-name:var(--font-outfit)] text-xs text-red-100"
              role="alert"
            >
              This account has been disabled. For help, reach out through{" "}
              <a
                href="https://discord.gg/hollowedoath"
                className="text-[#F0BA19] underline-offset-2 hover:underline"
              >
                official Discord
              </a>
              .
            </div>
          ) : null}
        </section>

        {/* Side column: supporter (backers only) + activity */}
        <aside className="flex flex-col gap-6">
          {showSupporterCard ? (
            <section className="rounded-2xl border border-[#F0BA19]/30 bg-black/45 p-5 shadow-[0_0_24px_rgba(240,186,25,0.08)] backdrop-blur-sm">
              <h2 className="font-[family-name:var(--font-cinzel)] text-base font-semibold text-[#F0BA19]">
                Supporter
              </h2>
              <p className="mt-1 font-[family-name:var(--font-outfit)] text-[11px] leading-relaxed text-white/50">
                Kickstarter backer record on this account
              </p>
              <div className="mt-4">
                {(() => {
                  const tier = profile?.kickstarter_tier;
                  const hasTier =
                    typeof tier === "number" &&
                    Number.isFinite(tier) &&
                    tier >= 1;
                  if (hasTier) {
                    return (
                      <div>
                        <p className="font-[family-name:var(--font-outfit)] text-2xl font-bold tabular-nums tracking-tight text-[#f4e9d8]">
                          Tier {tier}
                        </p>
                        <p className="mt-1 font-[family-name:var(--font-outfit)] text-xs text-white/55">
                          Thank you for backing Hollowed Oath.
                        </p>
                      </div>
                    );
                  }
                  return (
                    <p className="font-[family-name:var(--font-outfit)] text-sm font-semibold text-emerald-100/95">
                      Backer
                    </p>
                  );
                })()}
              </div>
            </section>
          ) : null}

          <section className="rounded-2xl border border-white/15 bg-black/45 p-5 backdrop-blur-sm">
            <h2 className="font-[family-name:var(--font-cinzel)] text-base font-semibold text-[#F0BA19]">
              Activity
            </h2>
            <dl className="mt-3 space-y-2 font-[family-name:var(--font-outfit)] text-xs text-white/65">
              <div className="flex justify-between gap-2">
                <dt>Last sign-in (HAMS)</dt>
                <dd className="text-right text-white/80">
                  {formatWhen(profile?.last_login_at) ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt>Account created</dt>
                <dd className="text-right text-white/80">
                  {formatWhen(profile?.created_at) ?? "—"}
                </dd>
              </div>
            </dl>
          </section>

          <a
            href="https://hollowedoath.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl border border-[#F0BA19]/25 bg-gradient-to-br from-[#F0BA19]/10 to-transparent px-4 py-3 text-center font-[family-name:var(--font-outfit)] text-sm font-medium text-[#F0BA19] transition hover:border-[#F0BA19]/50 hover:from-[#F0BA19]/15"
          >
            Visit hollowedoath.com
            <span className="ml-1 inline-block transition group-hover:translate-x-0.5">→</span>
          </a>
        </aside>
      </div>

      {/* Linked services */}
      <section className="rounded-2xl border border-[#F0BA19]/25 bg-[hsl(30_10%_7%/0.92)] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-cinzel)] text-lg font-semibold text-[#F0BA19]">
              Linked services
            </h2>
            <p className="mt-1 max-w-xl font-[family-name:var(--font-outfit)] text-xs text-white/55">
              Connect Discord for community and future in-game perks. More providers may appear here
              over time.
            </p>
          </div>
          {discordFromProfile?.external_username ? (
            <p className="mt-2 font-[family-name:var(--font-outfit)] text-[11px] text-emerald-200/80 sm:mt-0">
              Profile lists Discord:{" "}
              <span className="font-semibold text-white">
                {discordFromProfile.external_username}
              </span>
            </p>
          ) : null}
        </div>
        <div className="mt-5">
          <DiscordLinkSection variant="dashboard" onLinksChanged={() => void load()} />
        </div>
      </section>

      <PasswordSecuritySection />

      {/* Session */}
      <footer className="flex flex-col items-stretch justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
        <SignedInActions />
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 font-[family-name:var(--font-outfit)] text-sm text-white/50 sm:justify-end">
          <Link href="/" className="text-[#F0BA19] underline-offset-2 hover:underline">
            Home
          </Link>
          <span className="text-white/25" aria-hidden>
            ·
          </span>
          <Link href="/signup" className="text-[#F0BA19] underline-offset-2 hover:underline">
            Create another account
          </Link>
          <span className="text-white/25" aria-hidden>
            ·
          </span>
          <a
            href="https://discord.gg/hollowedoath"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#F0BA19] underline-offset-2 hover:underline"
          >
            Community Discord
          </a>
        </div>
      </footer>
    </div>
  );
}
