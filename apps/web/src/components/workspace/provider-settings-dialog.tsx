"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Dialog } from "@base-ui/react/dialog";
import type { ExternalProviderId } from "@beui-ai-studio/ai";
import {
  BrainCircuit,
  Check,
  CircleDot,
  KeyRound,
  LoaderCircle,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ProviderStatus {
  providerId: ExternalProviderId;
  label: string;
  description: string;
  isConfigured: boolean;
  credentialHint: string | null;
  updatedAt: string | null;
}

interface ProviderSettingsDialogProps {
  onOpenChange: (open: boolean) => void;
}

const dialogBackdropClassName =
  "fixed inset-0 z-[70] min-h-dvh bg-foreground/20 backdrop-blur-[2px] transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0";

const dialogPopupClassName =
  "fixed left-1/2 top-1/2 z-[70] flex max-h-[min(46rem,calc(100dvh-2rem))] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl outline-none transition-[scale,opacity] duration-150 data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0";

function ProviderIcon({ providerId }: { providerId: ExternalProviderId }) {
  if (providerId === "openai") return <BrainCircuit className="size-4" />;
  if (providerId === "anthropic") return <Sparkles className="size-4" />;
  return <CircleDot className="size-4" />;
}

async function readError(response: Response, fallback: string) {
  const payload = await response.json().catch(() => null);
  return payload?.error?.message ?? fallback;
}

export function ProviderSettingsDialog({
  onOpenChange,
}: ProviderSettingsDialogProps) {
  const router = useRouter();
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [apiKeys, setApiKeys] = useState<Partial<Record<ExternalProviderId, string>>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(true);
  const [pendingProvider, setPendingProvider] =
    useState<ExternalProviderId | null>(null);
  const [providerToRemove, setProviderToRemove] =
    useState<ProviderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/providers", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(await readError(response, "Provider settings could not load."));
        }
        const payload = await response.json();
        setProviders(payload.providers);
      })
      .catch((caught) => {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(
          caught instanceof Error ? caught.message : "Provider settings could not load.",
        );
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, []);

  async function saveCredential(provider: ProviderStatus) {
    const apiKey = apiKeys[provider.providerId]?.trim() ?? "";
    if (apiKey.length < 12) return;

    setPendingProvider(provider.providerId);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/providers/${provider.providerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      if (!response.ok) {
        throw new Error(await readError(response, "The credential could not be saved."));
      }

      const payload = await response.json();
      setProviders((current) =>
        current.map((candidate) =>
          candidate.providerId === provider.providerId
            ? payload.provider
            : candidate,
        ),
      );
      setApiKeys((current) => ({ ...current, [provider.providerId]: "" }));
      setNotice(`${provider.label} credential saved.`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The credential could not be saved.");
    } finally {
      setPendingProvider(null);
    }
  }

  async function removeCredential(provider: ProviderStatus) {
    setPendingProvider(provider.providerId);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/providers/${provider.providerId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(await readError(response, "The credential could not be removed."));
      }

      setProviders((current) =>
        current.map((candidate) =>
          candidate.providerId === provider.providerId
            ? {
                ...candidate,
                isConfigured: false,
                credentialHint: null,
                updatedAt: null,
              }
            : candidate,
        ),
      );
      setProviderToRemove(null);
      setNotice(`${provider.label} credential removed.`);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "The credential could not be removed.",
      );
    } finally {
      setPendingProvider(null);
    }
  }

  const isPending = pendingProvider !== null;

  return (
    <>
      <Dialog.Root
        open
        onOpenChange={(nextOpen) => {
          if (isPending) return;
          onOpenChange(nextOpen);
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className={dialogBackdropClassName} />
          <Dialog.Popup className={dialogPopupClassName}>
            <div className="flex items-start gap-4 border-b border-border px-5 py-4 sm:px-6">
              <div className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-muted/45 text-muted-foreground">
                <KeyRound className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <Dialog.Title className="text-base font-semibold tracking-tight">
                  Provider settings
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm leading-5 text-muted-foreground">
                  Connect your own AI providers. Credentials are encrypted and never shown
                  again after saving.
                </Dialog.Description>
              </div>
              <Dialog.Close
                aria-label="Close provider settings"
                disabled={isPending}
                className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                <X className="size-4" />
              </Dialog.Close>
            </div>

            <div className="min-h-0 overflow-y-auto px-5 py-5 sm:px-6">
              <div className="mb-5 rounded-xl border border-border bg-muted/35 px-3.5 py-3 text-xs leading-5 text-muted-foreground">
                Saving does not contact the provider or make a paid request. The credential
                is used only when you select one of its models and send a prompt.
              </div>

              {error ? (
                <p role="alert" className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {error}
                </p>
              ) : null}
              {notice ? (
                <p role="status" className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
                  {notice}
                </p>
              ) : null}

              {isLoading ? (
                <div className="grid min-h-56 place-items-center text-muted-foreground">
                  <LoaderCircle className="size-5 animate-spin" aria-label="Loading providers" />
                </div>
              ) : (
                <div className="grid gap-3">
                  {providers.map((provider) => {
                    const pending = pendingProvider === provider.providerId;
                    const value = apiKeys[provider.providerId] ?? "";
                    return (
                      <section
                        key={provider.providerId}
                        aria-labelledby={`provider-${provider.providerId}`}
                        className="rounded-2xl border border-border bg-background p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                            <ProviderIcon providerId={provider.providerId} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h2
                                id={`provider-${provider.providerId}`}
                                className="text-sm font-medium"
                              >
                                {provider.label}
                              </h2>
                              {provider.isConfigured ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
                                  <Check className="size-3" /> Configured
                                </span>
                              ) : (
                                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground/75">
                                  Not configured
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                              {provider.description}
                            </p>
                            {provider.isConfigured ? (
                              <p className="mt-1 text-[11px] text-muted-foreground">
                                Current credential · ••••{provider.credentialHint}
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <form
                          className="mt-4 flex flex-col gap-2 sm:flex-row"
                          onSubmit={(event) => {
                            event.preventDefault();
                            void saveCredential(provider);
                          }}
                        >
                          <label className="sr-only" htmlFor={`api-key-${provider.providerId}`}>
                            {provider.label} API key
                          </label>
                          <input
                            id={`api-key-${provider.providerId}`}
                            type="password"
                            autoComplete="off"
                            spellCheck={false}
                            value={value}
                            onChange={(event) =>
                              setApiKeys((current) => ({
                                ...current,
                                [provider.providerId]: event.target.value,
                              }))
                            }
                            placeholder={
                              provider.isConfigured
                                ? "Enter a replacement credential"
                                : "Enter API credential"
                            }
                            className="h-9 min-w-0 flex-1 rounded-xl border border-input bg-background px-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                          />
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={isPending || value.trim().length < 12}
                              className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground outline-none transition-colors hover:bg-primary/80 focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 sm:flex-none"
                            >
                              {pending ? "Saving…" : provider.isConfigured ? "Replace" : "Save"}
                            </button>
                            {provider.isConfigured ? (
                              <button
                                type="button"
                                aria-label={`Remove ${provider.label} credential`}
                                disabled={isPending}
                                onClick={() => setProviderToRemove(provider)}
                                className="grid size-9 place-items-center rounded-lg text-destructive outline-none hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-destructive/30 disabled:opacity-50"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            ) : null}
                          </div>
                        </form>
                      </section>
                    );
                  })}
                </div>
              )}
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      <AlertDialog.Root
        open={providerToRemove !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !isPending) setProviderToRemove(null);
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className={dialogBackdropClassName} />
          <AlertDialog.Popup className="fixed left-1/2 top-1/2 z-[80] w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-popover p-5 text-popover-foreground shadow-2xl outline-none">
            <AlertDialog.Title className="text-base font-semibold">
              Remove {providerToRemove?.label} credential?
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-1.5 text-sm leading-6 text-muted-foreground">
              Its models will become unavailable for new requests. Existing messages will
              not be changed.
            </AlertDialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <AlertDialog.Close
                disabled={isPending}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
              >
                Cancel
              </AlertDialog.Close>
              <button
                type="button"
                disabled={isPending || !providerToRemove}
                onClick={() => {
                  if (providerToRemove) void removeCredential(providerToRemove);
                }}
                className="inline-flex h-9 items-center justify-center rounded-lg bg-destructive/10 px-3 text-sm font-medium text-destructive outline-none hover:bg-destructive/20 focus-visible:ring-2 focus-visible:ring-destructive/30 disabled:opacity-50"
              >
                {isPending ? "Removing…" : "Remove"}
              </button>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
