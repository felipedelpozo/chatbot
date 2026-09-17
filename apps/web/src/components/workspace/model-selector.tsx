"use client";

import { BrainCircuit, CircleDot, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/motion/select";
import type { ModelCatalogEntry } from "./types";

const providerLabels = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
} as const;

function ProviderIcon({ providerId }: { providerId: ModelCatalogEntry["providerId"] }) {
  if (providerId === "openai") return <BrainCircuit className="size-3.5" />;
  if (providerId === "anthropic") return <Sparkles className="size-3.5" />;
  return <CircleDot className="size-3.5" />;
}

export interface ModelSelectorProps {
  models: ModelCatalogEntry[];
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function ModelSelector({
  models,
  value,
  onValueChange,
  disabled,
}: ModelSelectorProps) {
  const selected = models.find((model) => model.id === value);
  const groups = Object.entries(providerLabels);

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled || models.length === 0}
      className="min-w-0"
    >
      <SelectTrigger className="h-8 w-auto max-w-52 rounded-xl border-0 bg-transparent px-2 py-0 text-xs hover:bg-muted focus-visible:ring-2">
        <span className="flex min-w-0 items-center gap-1.5 text-foreground/75">
          {selected ? <ProviderIcon providerId={selected.providerId} /> : null}
          <span className="truncate">
            {selected?.label ?? (models.length ? "Choose model" : "Connect a provider")}
          </span>
        </span>
      </SelectTrigger>
      <SelectContent className="right-auto w-72 shadow-none">
        {groups.map(([providerId, providerLabel]) => {
          const providerModels = models.filter(
            (model) => model.providerId === providerId,
          );
          if (!providerModels.length) return null;

          return (
            <div key={providerId} className="py-1 first:pt-0 last:pb-0">
              <div className="px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {providerLabel}
              </div>
              {providerModels.map((model) => (
                <SelectItem
                  key={model.id}
                  value={model.id}
                  className="py-2"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="grid size-5 shrink-0 place-items-center text-muted-foreground">
                      <ProviderIcon providerId={model.providerId} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-foreground">
                        {model.label}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {model.description}
                      </span>
                    </span>
                  </span>
                </SelectItem>
              ))}
            </div>
          );
        })}
      </SelectContent>
    </Select>
  );
}
