import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { db, sqlClient, user } from "@beui-ai-studio/db";
import { GET as getProviders } from "../src/app/api/providers/route";
import {
  DELETE as deleteProvider,
  PUT as putProvider,
} from "../src/app/api/providers/[providerId]/route";
import {
  listProviderConfigurations,
  loadProviderCredential,
  removeProviderCredential,
  saveProviderCredential,
} from "../src/lib/provider-credentials";

const ownerId = `provider-api-owner-${crypto.randomUUID()}`;
const otherOwnerId = `provider-api-owner-${crypto.randomUUID()}`;

beforeAll(async () => {
  await db.insert(user).values([
    { id: ownerId, name: "Provider Owner", email: `${ownerId}@example.test` },
    { id: otherOwnerId, name: "Other Owner", email: `${otherOwnerId}@example.test` },
  ]);
});

afterAll(async () => {
  await sqlClient`delete from "user" where id in (${ownerId}, ${otherOwnerId})`;
});

describe("provider settings API", () => {
  test("protects provider reads and mutations", async () => {
    expect((await getProviders(new Request("http://localhost/api/providers"))).status).toBe(
      401,
    );
    expect(
      (
        await putProvider(
          new Request("http://localhost/api/providers/openai", {
            method: "PUT",
            body: JSON.stringify({ apiKey: "test-provider-value" }),
          }),
          { params: Promise.resolve({ providerId: "openai" }) },
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await deleteProvider(
          new Request("http://localhost/api/providers/openai", {
            method: "DELETE",
          }),
          { params: Promise.resolve({ providerId: "openai" }) },
        )
      ).status,
    ).toBe(401);
  });

  test("returns masked owner-scoped status while the server can resolve the value", async () => {
    const apiKey = "test-user-owned-provider-key-1234";
    await saveProviderCredential(ownerId, "openai", apiKey);

    const ownerStatuses = await listProviderConfigurations(ownerId);
    const openAI = ownerStatuses.find((provider) => provider.providerId === "openai");
    expect(openAI).toMatchObject({
      isConfigured: true,
      credentialHint: "1234",
    });
    expect(JSON.stringify(ownerStatuses)).not.toContain(apiKey);
    expect(await loadProviderCredential(ownerId, "openai")).toBe(apiKey);

    const otherStatuses = await listProviderConfigurations(otherOwnerId);
    expect(
      otherStatuses.find((provider) => provider.providerId === "openai")
        ?.isConfigured,
    ).toBe(false);
    expect(await loadProviderCredential(otherOwnerId, "openai")).toBeNull();

    await removeProviderCredential(ownerId, "openai");
  });
});
