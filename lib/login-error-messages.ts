/**
 * User-facing copy for HAMS / AdminSite login error `code` values exposed via NextAuth.
 */

export function messageForLoginCode(
  code: string | undefined,
  fallback?: string
): string {
  switch (code) {
    case "USER_NOT_FOUND":
      return "No account exists with that email. Check the address or create an account.";
    case "INVALID_PASSWORD":
    case "INVALID_CREDENTIALS":
      return "That password isn’t correct. Try again or reset your password.";
    case "INVALID_EMAIL":
      return "Enter a valid email address.";
    case "ACCOUNT_DISABLED":
      return "This account has been disabled. Contact support if you need help.";
    case "ACCOUNT_LOCKED":
      return "This account is locked. Try again later or contact support if you need help.";
    case "ACCOUNT_INACTIVE":
      return "This account isn’t active yet. Contact support if you need help.";
    case "EMAIL_NOT_VERIFIED":
      return "This account exists but email is not verified yet. Send yourself a new code to finish.";
    case "ACCOUNT_SERVICE_ERROR":
    case "SIGN_IN_FAILED":
      return "Sign-in couldn’t be completed right now. Please try again in a few minutes.";
    case "MISSING_CREDENTIALS":
      return "Enter your email and password.";
    default: {
      const f = fallback?.trim();
      /** NextAuth surfaces the exception type name, not a user-facing message. */
      if (f && !/^credentialssignin$/i.test(f)) return f;
      return "Sign in failed. Please try again.";
    }
  }
}
