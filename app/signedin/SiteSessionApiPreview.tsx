"use client";

import { useEffect, useState } from "react";

type MeOk = {
  site: string;
  authenticated: true;
  user: { id: string; email: string | null };
  profile?: unknown;
  profile_note?: string | null;
  session: Record<string, string>;
};

type MeErr = {
  site?: string;
  authenticated?: false;
  message?: string;
};

export function SiteSessionApiPreview() {
  const [text, setText] = useState<string>("Loading…");
  const [status, setStatus] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "same-origin", cache: "no-store" });
        const data = (await res.json().catch(() => ({}))) as MeOk | MeErr;
        if (cancelled) return;
        setStatus(res.status);
        setText(JSON.stringify(data, null, 2));
      } catch {
        if (!cancelled) {
          setStatus(null);
          setText("Could not fetch /api/me");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mt-6 rounded-md border border-white/15 bg-black/35 p-4 text-left">
      <p className="font-[family-name:var(--font-outfit)] text-xs font-medium uppercase tracking-wider text-white/45">
        Account record
      </p>
      <p className="mt-1 font-[family-name:var(--font-outfit)] text-xs leading-relaxed text-white/50">
        <code className="text-[#F0BA19]/85">GET /api/me</code>
        {status != null ? (
          <span className="text-white/40"> — HTTP {status}</span>
        ) : null}{" "}
        returns your portal session plus a <strong className="text-white/70">HAMS profile</strong>{" "}
        when your login token is present — status, Kickstarter, locks, linked Discord, etc.
      </p>
      <pre className="mt-3 max-h-64 overflow-auto rounded border border-white/10 bg-black/50 p-3 font-mono text-[11px] leading-relaxed text-emerald-100/90">
        {text}
      </pre>
    </div>
  );
}
