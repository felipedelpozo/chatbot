import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from "node:crypto";
import type { ExternalProviderId } from "./catalog";

const encryptionVersion = 1;
const initializationVectorByteLength = 12;

export interface ProviderCredentialContext {
  ownerId: string;
  providerId: ExternalProviderId;
  secret: string;
}

export interface EncryptedProviderCredential {
  ciphertext: string;
  initializationVector: string;
  authenticationTag: string;
  encryptionVersion: number;
}

function deriveEncryptionKey(secret: string) {
  if (secret.length < 32) {
    throw new Error("The server credential secret must contain at least 32 characters.");
  }

  return Buffer.from(
    hkdfSync(
      "sha256",
      Buffer.from(secret, "utf8"),
      Buffer.from("beui-ai-studio", "utf8"),
      Buffer.from(`provider-credential:v${encryptionVersion}`, "utf8"),
      32,
    ),
  );
}

function createAdditionalData(context: ProviderCredentialContext) {
  return Buffer.from(
    `beui-ai-studio:v${encryptionVersion}:${context.ownerId}:${context.providerId}`,
    "utf8",
  );
}

export function encryptProviderCredential(
  apiKey: string,
  context: ProviderCredentialContext,
): EncryptedProviderCredential {
  if (!apiKey) throw new Error("A provider credential is required.");

  const initializationVector = randomBytes(initializationVectorByteLength);
  const cipher = createCipheriv(
    "aes-256-gcm",
    deriveEncryptionKey(context.secret),
    initializationVector,
  );
  cipher.setAAD(createAdditionalData(context));
  const ciphertext = Buffer.concat([
    cipher.update(apiKey, "utf8"),
    cipher.final(),
  ]);

  return {
    ciphertext: ciphertext.toString("base64url"),
    initializationVector: initializationVector.toString("base64url"),
    authenticationTag: cipher.getAuthTag().toString("base64url"),
    encryptionVersion,
  };
}

export function decryptProviderCredential(
  credential: EncryptedProviderCredential,
  context: ProviderCredentialContext,
) {
  if (credential.encryptionVersion !== encryptionVersion) {
    throw new Error("The provider credential encryption version is unsupported.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    deriveEncryptionKey(context.secret),
    Buffer.from(credential.initializationVector, "base64url"),
  );
  decipher.setAAD(createAdditionalData(context));
  decipher.setAuthTag(Buffer.from(credential.authenticationTag, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(credential.ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
