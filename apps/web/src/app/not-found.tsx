import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-svh place-items-center px-6 text-center">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Not found</p>
        <h1 className="mt-3 text-xl font-semibold">This conversation is unavailable</h1>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          It may have been removed, or it does not belong to your account.
        </p>
        <Link href="/" className="mt-5 inline-flex h-9 items-center rounded-xl bg-foreground px-4 text-sm font-medium text-background">
          Return to workspace
        </Link>
      </div>
    </main>
  );
}

