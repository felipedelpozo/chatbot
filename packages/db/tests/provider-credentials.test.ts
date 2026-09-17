import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../src/client";
import { createProviderCredentialRepository } from "../src/repositories";
import { user } from "../src/schema";

const ownerId = `credential-owner-${crypto.randomUUID()}`;
const otherOwnerId = `credential-owner-${crypto.randomUUID()}`;
const repository = createProviderCredentialRepository(db);

beforeAll(async () => {
  await db.insert(user).values([
    { id: ownerId, name: "Credential Owner", email: `${ownerId}@example.test` },
    {
      id: otherOwnerId,
      name: "Other Credential Owner",
      email: `${otherOwnerId}@example.test`,
    },
  ]);
});

afterAll(async () => {
  await db.delete(user).where(eq(user.id, ownerId));
  await db.delete(user).where(eq(user.id, otherOwnerId));
});

function envelope(providerId: string, credentialHint: string) {
  return {
    providerId,
    ciphertext: `ciphertext-${credentialHint}`,
    initializationVector: `iv-${credentialHint}`,
    authenticationTag: `tag-${credentialHint}`,
    encryptionVersion: 1,
    credentialHint,
  };
}

describe("provider credential repository", () => {
  test("upserts one current credential and returns redacted list metadata", async () => {
    await repository.upsert(ownerId, envelope("openai", "1111"));
    await repository.upsert(ownerId, envelope("openai", "2222"));

    const list = await repository.list(ownerId);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ providerId: "openai", credentialHint: "2222" });
    expect(list[0]).not.toHaveProperty("ciphertext");

    const stored = await repository.find(ownerId, "openai");
    expect(stored?.ciphertext).toBe("ciphertext-2222");
  });

  test("isolates owners and deletes only the requested owner's credential", async () => {
    await repository.upsert(ownerId, envelope("anthropic", "aaaa"));
    await repository.upsert(otherOwnerId, envelope("anthropic", "bbbb"));

    expect(await repository.find(otherOwnerId, "openai")).toBeNull();
    expect(await repository.delete(otherOwnerId, "openai")).toBe(false);
    expect(await repository.delete(ownerId, "anthropic")).toBe(true);
    expect(await repository.find(ownerId, "anthropic")).toBeNull();
    expect((await repository.find(otherOwnerId, "anthropic"))?.credentialHint).toBe(
      "bbbb",
    );
  });
});
