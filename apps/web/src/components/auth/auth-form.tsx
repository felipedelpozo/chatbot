"use client";

import { signIn, signUp } from "@beui-ai-studio/auth/client";
import { ArrowRight, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { isSafeReturnPath } from "@/lib/api";

export interface AuthFormProps {
  mode: "sign-in" | "sign-up";
  returnTo?: string;
}

export function AuthForm({ mode, returnTo }: AuthFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const isSignUp = mode === "sign-up";
  const destination = isSafeReturnPath(returnTo) ? returnTo! : "/";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "").trim();

    const result = isSignUp
      ? await signUp.email({ name, email, password })
      : await signIn.email({ email, password });

    if (result.error) {
      setError(result.error.message ?? "Authentication failed. Check your details.");
      setIsPending(false);
      return;
    }

    router.replace(destination);
    router.refresh();
  }

  return (
    <main className="grid min-h-svh place-items-center bg-muted/30 px-4 py-10">
      <section className="w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-7">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-xl bg-foreground text-xs font-semibold text-background">B</div>
          <span className="text-sm font-semibold">beUI AI Studio</span>
        </div>
        <h1 className="mt-8 text-xl font-semibold tracking-tight">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
          {isSignUp
            ? "Start a project and keep every conversation in context."
            : "Sign in to continue working in your project chats."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          {isSignUp ? (
            <label className="grid gap-1.5 text-sm font-medium">
              Name
              <input
                name="name"
                autoComplete="name"
                required
                maxLength={120}
                className="h-10 rounded-xl border border-input bg-background px-3 font-normal outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
          ) : null}
          <label className="grid gap-1.5 text-sm font-medium">
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="h-10 rounded-xl border border-input bg-background px-3 font-normal outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Password
            <input
              name="password"
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              minLength={12}
              maxLength={128}
              className="h-10 rounded-xl border border-input bg-background px-3 font-normal outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring"
            />
            {isSignUp ? (
              <span className="font-normal text-xs text-muted-foreground">Use at least 12 characters.</span>
            ) : null}
          </label>

          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}

          <button
            type="submit"
            disabled={isPending}
            className="mt-1 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-sm font-medium text-background outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {isSignUp ? "Create account" : "Sign in"}
            {!isPending ? <ArrowRight className="size-4" /> : null}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignUp ? "Already have an account?" : "New to the workspace?"}{" "}
          <Link
            href={`${isSignUp ? "/sign-in" : "/sign-up"}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`}
            className="font-medium text-foreground underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isSignUp ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </section>
    </main>
  );
}

