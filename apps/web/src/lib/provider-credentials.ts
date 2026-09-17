import {
  decryptProviderCredential,
  encryptProviderCredential,
  externalProviders,
  isExternalProviderId,
  type ExternalProviderId,
} from "@beui-ai-studio/ai";
import { providerCredentialRepository } from "@beui-ai-studio/db";
import { readServerEnvironment } from "./env";

export interface ProviderConfigurationStatus {
  providerId: ExternalProviderId;
  label: string;
  description: string;
  isConfigured: boolean;
  credentialHint: string | null;
  updatedAt: string | null;
}

function encryptionSecret() {
  return readServerEnvironment().BETTER_AUTH_SECRET;
}

export async function listProviderConfigurations(
  ownerId: string,
): Promise<ProviderConfigurationStatus[]> {
  const credentials = await providerCredentialRepository.list(ownerId);
  const credentialByProvider = new Map(
    credentials.map((credential) => [credential.providerId, credential]),
  );

  return externalProviders.map((provider) => {
    const credential = credentialByProvider.get(provider.id);
    return {
      providerId: provider.id,
      label: provider.label,
      description: provider.description,
      isConfigured: Boolean(credential),
      credentialHint: credential?.credentialHint ?? null,
      updatedAt: credential?.updatedAt.toISOString() ?? null,
    };
  });
}

export async function listConfiguredProviderIds(ownerId: string) {
  const credentials = await providerCredentialRepository.list(ownerId);
  return credentials
    .map((credential) => credential.providerId)
    .filter(isExternalProviderId);
}

export async function saveProviderCredential(
  ownerId: string,
  providerId: ExternalProviderId,
  value: string,
) {
  const apiKey = value.trim();
  const encrypted = encryptProviderCredential(apiKey, {
    ownerId,
    providerId,
    secret: encryptionSecret(),
  });

  return providerCredentialRepository.upsert(ownerId, {
    providerId,
    ...encrypted,
    credentialHint: apiKey.slice(-4),
  });
}

export async function loadProviderCredential(
  ownerId: string,
  providerId: ExternalProviderId,
) {
  const credential = await providerCredentialRepository.find(ownerId, providerId);
  if (!credential) return null;

  return decryptProviderCredential(credential, {
    ownerId,
    providerId,
    secret: encryptionSecret(),
  });
}

export async function removeProviderCredential(
  ownerId: string,
  providerId: ExternalProviderId,
) {
  return providerCredentialRepository.delete(ownerId, providerId);
}
