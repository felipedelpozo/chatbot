import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { getSession } from "@/lib/session";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  if (await getSession()) redirect("/");
  const { returnTo } = await searchParams;
  return <AuthForm mode="sign-in" returnTo={returnTo} />;
}

