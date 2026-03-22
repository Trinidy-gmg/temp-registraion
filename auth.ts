import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { CredentialsSignin } from "next-auth";
import { authBackendPost, getAuthBackendConfig } from "@/lib/auth-backend";
import { coerceLoginTokens } from "@/lib/auth-session-cookies";

/** Auth.js v5 expects AUTH_SECRET / AUTH_URL; mirror NEXTAUTH_* for older env files. */
if (!process.env.AUTH_SECRET && process.env.NEXTAUTH_SECRET) {
  process.env.AUTH_SECRET = process.env.NEXTAUTH_SECRET;
}
if (!process.env.AUTH_URL && process.env.NEXTAUTH_URL) {
  process.env.AUTH_URL = process.env.NEXTAUTH_URL;
}

function throwCredentialsCode(code: string): never {
  const e = new CredentialsSignin();
  e.code = code;
  throw e;
}

function emailNotVerified(): never {
  throwCredentialsCode("EMAIL_NOT_VERIFIED");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      id: "credentials",
      name: "Hollowed Oath",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string" ? credentials.email.trim() : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) {
          throwCredentialsCode("MISSING_CREDENTIALS");
        }

        try {
          getAuthBackendConfig();
        } catch {
          console.error("[auth] account API base URL not configured");
          throwCredentialsCode("ACCOUNT_SERVICE_ERROR");
        }

        let result: Awaited<ReturnType<typeof authBackendPost<unknown>>>;
        try {
          result = await authBackendPost<Record<string, unknown>>("login", {
            email,
            password,
          });
        } catch (e) {
          console.error("[auth] account service login request failed", e);
          throwCredentialsCode("ACCOUNT_SERVICE_ERROR");
        }

        if (!result.ok) {
          const data = result.data as { code?: string };
          if (data?.code === "EMAIL_NOT_VERIFIED") {
            emailNotVerified();
          }
          if (
            data?.code === "LOGIN_INCOMPLETE" ||
            data?.code === "ADMIN_SITE_NON_JSON"
          ) {
            throwCredentialsCode("ACCOUNT_SERVICE_ERROR");
          }
          if (typeof data?.code === "string" && data.code.length > 0) {
            throwCredentialsCode(data.code);
          }
          throwCredentialsCode("SIGN_IN_FAILED");
        }

        const coerced = coerceLoginTokens(result.data);
        if (!coerced.ok) {
          console.error("[auth] login JSON shape", coerced);
          throwCredentialsCode("ACCOUNT_SERVICE_ERROR");
        }

        // Store only id + email in the JWT so the session cookie stays small (HAMS tokens are huge).
        return {
          id: coerced.tokens.account_id,
          email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email ?? undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.sub as string) ?? "";
        if (typeof token.email === "string") {
          session.user.email = token.email;
        }
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
});
