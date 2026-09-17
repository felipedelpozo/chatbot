import { describe, expect, test } from "bun:test";
import {
  decryptProviderCredential,
  encryptProviderCredential,
} from "../src/provider-credentials";

const secret = "test-only-secret-with-more-than-thirty-two-characters";

describe("provider credential encryption", () => {
  test("round-trips without storing the plaintext", () => {
    const context = { ownerId: "owner-a", providerId: "openai" as const, secret };
    const encrypted = encryptProviderCredential("sk-test-private-value", context);

    expect(encrypted.ciphertext).not.toContain("sk-test-private-value");
    expect(decryptProviderCredential(encrypted, context)).toBe(
      "sk-test-private-value",
    );
  });

  test("rejects an envelope moved to another owner or provider", () => {
    const encrypted = encryptProviderCredential("private-value", {
      ownerId: "owner-a",
      providerId: "anthropic",
      secret,
    });

    expect(() =>
      decryptProviderCredential(encrypted, {
        ownerId: "owner-b",
        providerId: "anthropic",
        secret,
      }),
    ).toThrow();
    expect(() =>
      decryptProviderCredential(encrypted, {
        ownerId: "owner-a",
        providerId: "google",
        secret,
      }),
    ).toThrow();
  });
});
