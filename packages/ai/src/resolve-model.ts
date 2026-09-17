import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import type { ModelCatalogEntry } from "./catalog";

export interface ResolvedModel {
  entry: ModelCatalogEntry;
  model: LanguageModel;
}

export function resolveLanguageModel(
  entry: ModelCatalogEntry,
  apiKey: string,
): ResolvedModel {
  if (!apiKey.trim()) throw new Error("The provider credential is empty.");

  if (entry.providerId === "openai") {
    const provider = createOpenAI({ apiKey });
    return { entry, model: provider(entry.modelId) };
  }

  if (entry.providerId === "anthropic") {
    const provider = createAnthropic({ apiKey });
    return { entry, model: provider(entry.modelId) };
  }

  const provider = createGoogleGenerativeAI({ apiKey });
  return { entry, model: provider(entry.modelId) };
}
