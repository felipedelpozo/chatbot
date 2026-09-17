export const externalProviderIds = ["openai", "anthropic", "google"] as const;
export type ExternalProviderId = (typeof externalProviderIds)[number];

export const providerIds = externalProviderIds;
export type ProviderId = (typeof providerIds)[number];

export const externalProviders = [
  {
    id: "openai",
    label: "OpenAI",
    description: "GPT models through your personal OpenAI API credential.",
  },
  {
    id: "anthropic",
    label: "Anthropic",
    description: "Claude models through your personal Anthropic API credential.",
  },
  {
    id: "google",
    label: "Google",
    description: "Gemini models through your personal Google AI credential.",
  },
] as const satisfies ReadonlyArray<{
  id: ExternalProviderId;
  label: string;
  description: string;
}>;

export interface ModelCatalogEntry {
  id: string;
  providerId: ProviderId;
  modelId: string;
  label: string;
  description: string;
  isAvailable: boolean;
  isDefault: boolean;
}

export interface ProviderModelEnvironment {
  OPENAI_MODEL?: string;
  ANTHROPIC_MODEL?: string;
  GOOGLE_MODEL?: string;
}

interface CuratedModelDefinition {
  modelId: string;
  label: string;
  description: string;
}

const providerModels = {
  openai: [
    {
      modelId: "gpt-5.6",
      label: "GPT-5.6",
      description: "Flagship model for complex reasoning and coding.",
    },
    {
      modelId: "gpt-5.6-terra",
      label: "GPT-5.6 Terra",
      description: "Balanced intelligence and cost for everyday work.",
    },
    {
      modelId: "gpt-5.6-luna",
      label: "GPT-5.6 Luna",
      description: "Fast model for interactive and high-volume tasks.",
    },
  ],
  anthropic: [
    {
      modelId: "claude-sonnet-5",
      label: "Claude Sonnet 5",
      description: "Balanced model for agents and everyday work.",
    },
    {
      modelId: "claude-opus-5",
      label: "Claude Opus 5",
      description: "Highest-capability model for complex agentic work.",
    },
    {
      modelId: "claude-haiku-4-5",
      label: "Claude Haiku 4.5",
      description: "Fast and efficient model for lightweight tasks.",
    },
  ],
  google: [
    {
      modelId: "gemini-3.1-pro-preview",
      label: "Gemini 3.1 Pro (Preview)",
      description: "Advanced reasoning model for complex tasks.",
    },
    {
      modelId: "gemini-3-flash-preview",
      label: "Gemini 3 Flash (Preview)",
      description: "Fast multimodal model for responsive experiences.",
    },
    {
      modelId: "gemini-2.5-flash",
      label: "Gemini 2.5 Flash",
      description: "Stable low-latency model for general workloads.",
    },
  ],
} as const satisfies Record<ProviderId, readonly CuratedModelDefinition[]>;

export function readProviderModelEnvironment(): ProviderModelEnvironment {
  return {
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
    GOOGLE_MODEL: process.env.GOOGLE_MODEL,
  };
}

export function isExternalProviderId(value: string): value is ExternalProviderId {
  return externalProviderIds.some((providerId) => providerId === value);
}

function getModelOverride(
  providerId: ProviderId,
  environment: ProviderModelEnvironment,
) {
  if (providerId === "openai") return environment.OPENAI_MODEL?.trim();
  if (providerId === "anthropic") return environment.ANTHROPIC_MODEL?.trim();
  return environment.GOOGLE_MODEL?.trim();
}

function getProviderModels(
  providerId: ProviderId,
  environment: ProviderModelEnvironment,
): CuratedModelDefinition[] {
  const curated = [...providerModels[providerId]];
  const override = getModelOverride(providerId, environment);
  if (!override) return curated;

  const existing = curated.find((model) => model.modelId === override);
  if (existing) {
    return [existing, ...curated.filter((model) => model.modelId !== override)];
  }

  return [
    {
      modelId: override,
      label: override,
      description: "Model configured through the local environment override.",
    },
    ...curated,
  ];
}

export function getModelCatalog(
  configuredProviders: Iterable<ExternalProviderId> = [],
  environment: ProviderModelEnvironment = readProviderModelEnvironment(),
): ModelCatalogEntry[] {
  const configured = new Set(configuredProviders);
  const entries = externalProviderIds.flatMap((providerId) => {
    if (!configured.has(providerId)) return [];

    return getProviderModels(providerId, environment).map((model) => ({
      id: `${providerId}:${model.modelId}`,
      providerId,
      modelId: model.modelId,
      label: model.label,
      description: model.description,
      isAvailable: true,
      isDefault: false,
    }));
  });

  return entries.map((entry, index) => ({ ...entry, isDefault: index === 0 }));
}

export function getCatalogEntry(
  id: string,
  configuredProviders: Iterable<ExternalProviderId> = [],
  environment: ProviderModelEnvironment = readProviderModelEnvironment(),
) {
  const configured = new Set(configuredProviders);
  const providerId = id.slice(0, id.indexOf(":"));
  if (!isExternalProviderId(providerId)) return null;

  const isConfigured = configured.has(providerId);
  const configuredForLookup = isConfigured ? [providerId] : externalProviderIds;
  const entry = getModelCatalog(configuredForLookup, environment).find(
    (candidate) => candidate.id === id,
  );
  return entry
    ? { ...entry, isAvailable: isConfigured, isDefault: isConfigured && entry.isDefault }
    : null;
}

export function requireAvailableCatalogEntry(
  id: string,
  configuredProviders: Iterable<ExternalProviderId> = [],
  environment: ProviderModelEnvironment = readProviderModelEnvironment(),
) {
  const entry = getCatalogEntry(id, configuredProviders, environment);
  if (!entry) throw new Error("Unknown model selection.");
  if (!entry.isAvailable) throw new Error("The selected model is not configured.");
  return entry;
}
