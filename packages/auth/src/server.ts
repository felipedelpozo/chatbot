import { db } from "@beui-ai-studio/db";
import { account, session, user, verification } from "@beui-ai-studio/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

function requireServerEnv(name: "BETTER_AUTH_SECRET" | "BETTER_AUTH_URL") {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

const baseURL = requireServerEnv("BETTER_AUTH_URL");

export const auth = betterAuth({
  appName: "beUI AI Studio",
  baseURL,
  secret: requireServerEnv("BETTER_AUTH_SECRET"),
  trustedOrigins: [baseURL, "http://localhost:3000", "http://127.0.0.1:3000"],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
    transaction: true,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 14,
    updateAge: 60 * 60 * 24,
  },
  advanced: {
    cookiePrefix: "beui-ai-studio",
    useSecureCookies: process.env.NODE_ENV === "production",
  },
});

export type AuthSession = typeof auth.$Infer.Session;

