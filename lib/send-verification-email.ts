/**
 * Send 8-digit verification email via SendGrid (dynamic template or simple HTML).
 */

export type SendVerificationResult =
  | { ok: true }
  | { ok: false; error: string };

export async function sendVerificationEmail(
  toEmail: string,
  code: string
): Promise<SendVerificationResult> {
  const apiKey = process.env.SENDGRID_API_KEY?.trim();
  if (!apiKey) {
    console.error("[sendgrid] SENDGRID_API_KEY is not set");
    return { ok: false, error: "Email service is not configured" };
  }

  const from =
    process.env.SENDGRID_FROM_EMAIL?.trim() ||
    process.env.SENDGRID_FROM?.trim() ||
    "";
  if (!from) {
    console.error("[sendgrid] SENDGRID_FROM_EMAIL is not set");
    return { ok: false, error: "Email sender is not configured" };
  }

  const fromName =
    process.env.SENDGRID_FROM_NAME?.trim() || "Hollowed Oath";

  const templateId = process.env.SENDGRID_VERIFICATION_TEMPLATE_ID?.trim();

  const body = templateId
    ? {
        from: { email: from, name: fromName },
        personalizations: [
          {
            to: [{ email: toEmail }],
            dynamic_template_data: {
              code,
              email: toEmail,
            },
          },
        ],
        template_id: templateId,
      }
    : {
        from: { email: from, name: fromName },
        personalizations: [{ to: [{ email: toEmail }] }],
        subject: "Your Hollowed Oath verification code",
        content: [
          {
            type: "text/html",
            value: simpleVerificationHtml(code, toEmail),
          },
        ],
      };

  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[sendgrid] send failed", res.status, text.slice(0, 500));
      return { ok: false, error: "Could not send verification email" };
    }
    return { ok: true };
  } catch (e) {
    console.error("[sendgrid] request error", e);
    return { ok: false, error: "Could not send verification email" };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Fallback when no dynamic template ID is set (dev / staging). */
function simpleVerificationHtml(code: string, email: string): string {
  const c = escapeHtml(code);
  const e = escapeHtml(email);
  return `<!DOCTYPE html><html><body style="margin:0;background:#141210;font-family:system-ui,sans-serif;color:#ebe6dc;padding:32px;">
  <div style="max-width:560px;margin:0 auto;border:1px solid rgba(240,186,25,0.35);border-radius:12px;padding:32px;background:#1a1714;">
    <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:20px;color:#f0ba19;letter-spacing:0.1em;text-transform:uppercase;">Hollowed Oath</p>
    <p style="margin:0 0 20px;font-size:14px;color:rgba(235,230,220,0.6);">Account verification</p>
    <p style="font-size:15px;line-height:1.5;">Your verification code:</p>
    <p style="font-size:28px;font-weight:700;letter-spacing:0.3em;color:#f0ba19;font-family:monospace;">${c}</p>
    <p style="font-size:12px;color:rgba(235,230,220,0.45);">Sent to ${e}</p>
  </div></body></html>`;
}
