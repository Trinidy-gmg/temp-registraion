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

function emailNotVerified(): never {
  const e = new CredentialsSignin();
  e.code = "EMAIL_NOT_VERIFIED";
  throw e;
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
          return null;
        }

        try {
          getAuthBackendConfig();
        } catch {
          console.error("[auth] account API base URL not configured");
          return null;
        }

        let result: Awaited<ReturnType<typeof authBackendPost<unknown>>>;
        try {
          result = await authBackendPost<Record<string, unknown>>("login", {
            email,
            password,
          });
        } catch (e) {
          console.error("[auth] account service login request failed", e);
          return null;
        }

        if (!result.ok) {
          const data = result.data as { code?: string };
          if (result.status === 403 && data?.code === "EMAIL_NOT_VERIFIED") {
            emailNotVerified();
          }
          return null;
        }

        const coerced = coerceLoginTokens(result.data);
        if (!coerced.ok) {
          console.error("[auth] login JSON shape", coerced);
          return null;
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
