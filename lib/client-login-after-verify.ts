/**
 * Browser-only: after email is verified, obtain session cookies via `/api/auth/login`.
 * Retries once if HAMS still reports EMAIL_NOT_VERIFIED (eventual consistency).
 */

export type LoginJson = {
  ok?: boolean;
  account_id?: string;
  error?: string;
  code?: string;
  hint?: string;
  keys?: string[];
};

export async function fetchLoginAfterVerification(opts: {
  email: string;
  password: string;
  keepMeSignedIn: boolean;
}): Promise<
  | { ok: true; account_id: string }
  | { ok: false; message: string; code?: string; hint?: string }
> {
  const { email, password, keepMeSignedIn } = opts;

  const doLogin = () =>
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      cache: "no-store",
      body: JSON.stringify({ email: email.trim(), password, keepMeSignedIn }),
    });

  let res = await doLogin();
  let data = (await res.json().catch(() => ({}))) as LoginJson;

  if (!res.ok && res.status === 403 && data.code === "EMAIL_NOT_VERIFIED") {
    await new Promise((r) => setTimeout(r, 400));
    res = await doLogin();
    data = (await res.json().catch(() => ({}))) as LoginJson;
  }

  if (!res.ok) {
    const parts = [
      data.error || `Sign in failed (${res.status})`,
      data.code ? `[${data.code}]` : "",
      data.hint ? data.hint.slice(0, 240) : "",
    ].filter(Boolean);
    return {
      ok: false,
      message: parts.join(" "),
      code: data.code,
      hint: data.hint,
    };
  }

  const account_id =
    typeof data.account_id === "string" ? data.account_id.trim() : "";
  if (!account_id) {
    return {
      ok: false,
      message:
        "Sign-in response missing account id. Check AdminSite → HAMS login JSON includes account_id.",
    };
  }

  return { ok: true, account_id };
}
