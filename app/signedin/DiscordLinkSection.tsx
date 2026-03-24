"use client";

import { useCallback, useEffect, useState } from "react";

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

export function DiscordLinkSection() {
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linksBody, setLinksBody] = useState<LinksResponse | null>(null);

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
      window.location.assign(data.authorization_url);
    } catch {
      setError("Could not start Discord linking.");
    } finally {
      setLinking(false);
    }
  }

  if (!configured && !loading) {
    return (
      <div className="mt-6 rounded-md border border-white/10 bg-black/25 px-4 py-3 font-[family-name:var(--font-outfit)] text-sm text-white/55">
        Discord linking requires{" "}
        <code className="text-[#F0BA19]/90">HAMS_API_URL</code> and{" "}
        <code className="text-[#F0BA19]/90">HAMS_API_KEY</code> on this app.
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-md border border-[#5865F2]/35 bg-[#5865F2]/10 px-4 py-4">
      <h3 className="font-[family-name:var(--font-cinzel)] text-sm font-semibold tracking-wide text-[#F0BA19]">
        Discord
      </h3>
      <p className="mt-1 font-[family-name:var(--font-outfit)] text-xs leading-relaxed text-white/60">
        Link your Discord account to your Hollowed Oath profile. You will be sent to
        Discord to approve access, then returned here.
      </p>

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
