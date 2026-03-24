"use client";

import { useCallback, useEffect, useState } from "react";

function normalizeOAuthRedirectUri(u: string): string {
  return u.trim().replace(/\/$/, "");
}

/** Callback path fixed by app Route Handler — must match HAMS DISCORD_REDIRECT_URI + Discord app redirects. */
const DISCORD_CALLBACK_PATH = "/oauth/discord/callback";

type OAuthLink = {
  provider: string;
  external_username?: string | null;
  external_id?: string;
};

type LinksResponse = {
  links?: OAuthLink[];
  configured?: boolean;
  message?: string;
  error?: string;
  code?: string;
};

export function DiscordLinkSection({
  variant = "default",
}: {
  /** `dashboard` = embedded in account page (no outer duplicate chrome). */
  variant?: "default" | "dashboard";
}) {
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linksBody, setLinksBody] = useState<LinksResponse | null>(null);
  const [expectedDiscordRedirect, setExpectedDiscordRedirect] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    setExpectedDiscordRedirect(
      normalizeOAuthRedirectUri(`${window.location.origin}${DISCORD_CALLBACK_PATH}`)
    );
  }, []);

  const loadLinks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/oauth/links", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const data = (await res.json().catch(() => ({}))) as LinksResponse;
      if (!res.ok) {
        setError(data.error || `Could not load links (${res.status})`);
        setLinksBody(null);
        return;
      }
      setLinksBody(data);
    } catch {
      setError("Could not reach the account service.");
      setLinksBody(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLinks();
  }, [loadLinks]);

  const discordLink = linksBody?.links?.find((l) => l.provider === "discord");
  const configured = linksBody?.configured !== false;

  async function startDiscordLink() {
    setLinking(true);
    setError(null);
    try {
      const res = await fetch("/api/oauth/discord/initiate", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
      const data = (await res.json().catch(() => ({}))) as {
        authorization_url?: string;
        error?: string;
        code?: string;
      };
      if (!res.ok || !data.authorization_url) {
        setError(
          data.error ||
            (data.code === "OAUTH_NOT_CONFIGURED"
              ? "Discord linking is not enabled on the server yet."
              : "Could not start Discord linking.")
        );
        return;
      }

      let redirectFromHams: string | null = null;
      try {
        const authUrl = new URL(data.authorization_url);
        redirectFromHams = authUrl.searchParams.get("redirect_uri");
      } catch {
        setError("Could not parse Discord authorization URL from the server.");
        return;
      }
      if (redirectFromHams) {
        const decoded = normalizeOAuthRedirectUri(
          decodeURIComponent(redirectFromHams)
        );
        const expected =
          typeof window !== "undefined"
            ? normalizeOAuthRedirectUri(
                `${window.location.origin}${DISCORD_CALLBACK_PATH}`
              )
            : null;
        if (expected && decoded !== expected) {
          setError(
            `Discord OAuth redirect URI mismatch. HAMS sent "${decoded}" but this site expects "${expected}". Set HAMS DISCORD_REDIRECT_URI and Discord OAuth2 redirects to: ${expected}`
          );
          return;
        }
      }

      window.location.assign(data.authorization_url);
    } catch {
      setError("Could not start Discord linking.");
    } finally {
      setLinking(false);
    }
  }

  const showRedirectHint = process.env.NODE_ENV === "development";

  if (!configured && !loading) {
    return (
      <div
        className={
          variant === "dashboard"
            ? "rounded-xl border border-white/10 bg-black/35 px-4 py-3 font-[family-name:var(--font-outfit)] text-sm text-white/55"
            : "mt-6 rounded-md border border-white/10 bg-black/25 px-4 py-3 font-[family-name:var(--font-outfit)] text-sm text-white/55"
        }
      >
        Discord linking needs{" "}
        <code className="text-[#F0BA19]/90">ADMINSITE_AUTH_BASE_URL</code> and{" "}
        <code className="text-[#F0BA19]/90">REGISTRATION_VERIFY_SECRET</code> on
        this app (AdminSite proxies to internal HAMS).
      </div>
    );
  }

  const shell =
    variant === "dashboard"
      ? "rounded-xl border border-[#5865F2]/40 bg-gradient-to-br from-[#5865F2]/15 to-black/20 px-5 py-5 shadow-inner shadow-black/20"
      : "mt-6 rounded-md border border-[#5865F2]/35 bg-[#5865F2]/10 px-4 py-4";

  return (
    <div className={shell}>
      {variant === "default" ? (
        <h3 className="font-[family-name:var(--font-cinzel)] text-sm font-semibold tracking-wide text-[#F0BA19]">
          Discord
        </h3>
      ) : (
        <h3 className="font-[family-name:var(--font-cinzel)] text-base font-semibold tracking-wide text-[#e8e4dc]">
          Discord
        </h3>
      )}
      <p className="mt-1 font-[family-name:var(--font-outfit)] text-xs leading-relaxed text-white/60">
        Link your Discord account to your Hollowed Oath profile. You will be sent to
        Discord to approve access, then returned here.
      </p>

      {expectedDiscordRedirect && showRedirectHint ? (
        <p className="mt-2 font-[family-name:var(--font-outfit)] text-[11px] leading-snug text-white/40">
          <span className="text-white/50">Redirect URI</span> (must match{" "}
          <code className="text-[#F0BA19]/80">DISCORD_REDIRECT_URI</code> on HAMS and
          Discord&apos;s OAuth2 redirects):{" "}
          <code className="break-all text-emerald-200/80">{expectedDiscordRedirect}</code>
        </p>
      ) : null}

      {error ? (
        <p
          className="mt-3 rounded border border-red-500/35 bg-red-950/30 px-3 py-2 font-[family-name:var(--font-outfit)] text-xs text-red-200"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-3 font-[family-name:var(--font-outfit)] text-xs text-white/45">
          Checking linked accounts…
        </p>
      ) : discordLink ? (
        <p className="mt-3 font-[family-name:var(--font-outfit)] text-sm text-emerald-100/90">
          Linked as{" "}
          <span className="font-semibold text-white">
            {discordLink.external_username || discordLink.external_id || "Discord user"}
          </span>
          .
        </p>
      ) : (
        <button
          type="button"
          disabled={linking}
          onClick={() => void startDiscordLink()}
          className="mt-4 w-full rounded-md border border-[#5865F2]/60 bg-[#5865F2]/20 py-2.5 font-[family-name:var(--font-outfit)] text-sm font-semibold text-white transition hover:border-[#5865F2] hover:bg-[#5865F2]/30 disabled:opacity-50"
        >
          {linking ? "Redirecting…" : "Link Discord account"}
        </button>
      )}
    </div>
  );
}
