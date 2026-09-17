export default function LoadingChat() {
  return (
    <main className="grid min-h-svh grid-cols-[17rem_1fr] bg-background">
      <aside className="hidden border-r border-border bg-muted/20 md:block" />
      <section className="grid place-items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="size-2 animate-pulse rounded-full bg-muted-foreground/50" />
          Loading conversation
        </div>
      </section>
    </main>
  );
}

