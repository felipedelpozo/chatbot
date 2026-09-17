import { auth } from "@beui-ai-studio/auth/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSession(returnTo = "/") {
  const session = await getSession();
  if (!session) redirect(`/sign-in?returnTo=${encodeURIComponent(returnTo)}`);
  return session;
}

export async function requireApiSession(request: Request) {
  return auth.api.getSession({ headers: request.headers });
}
