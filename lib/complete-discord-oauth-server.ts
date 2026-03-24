import {
  getOAuthProxyConfig,
  oauthProxyFetchJson,
} from "@/lib/adminsite-oauth-proxy";
import { readHamsAccessTokenFromCookies } from "@/lib/server-hams-auth-cookies";

export type CompleteDiscordOAuthResult =
  | { ok: true }
  | {
      ok: false;
      status: number;
      reason:
        | "not_configured"
        | "missing_token"
        | "discord_denied"
        | "bad_callback"
        | "hams_error";
      hamsCode?: string;
      message?: string;
    };

/**
 * Finishes Discord OAuth using the current request URL query and HAMS cookies.
 */
export async function completeDiscordOAuthFromRequestUrl(
  requestUrl: string
): Promise<CompleteDiscordOAuthResult> {
  const url = new URL(requestUrl);
  const code = url.searchParams.get("code")?.trim() ?? "";
  const state = url.searchParams.get("state")?.trim() ?? "";
  const discordError = url.searchParams.get("error")?.trim();

  if (discordError) {
    return { ok: false, status: 400, reason: "discord_denied" };
  }

  if (!code || !state) {
    return { ok: false, status: 400, reason: "bad_callback" };
  }

  let accessToken: string | null;
  try {
    getOAuthProxyConfig();
    accessToken = await readHamsAccessTokenFromCookies();
  } catch {
    return { ok: false, status: 503, reason: "not_configured" };
  }

  if (!accessToken) {
    return { ok: false, status: 401, reason: "missing_token" };
  }

  const qs = new URLSearchParams({ code, state });
  const { ok, status, data } = await oauthProxyFetchJson(
    `/discord/callback?${qs.toString()}`,
    { accessToken, method: "GET" }
  );

  if (!ok) {
    const body = data as { code?: string; error?: string };
    return {
      ok: false,
      status: status >= 400 && status < 600 ? status : 502,
      reason: "hams_error",
      hamsCode: body.code,
      message: body.error,
    };
  }

  return { ok: true };
}
