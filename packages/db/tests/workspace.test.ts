import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../src/client";
import { createWorkspaceRepository } from "../src/repositories";
import { user } from "../src/schema";

const ownerId = `test-owner-${crypto.randomUUID()}`;
const otherOwnerId = `test-owner-${crypto.randomUUID()}`;
const repository = createWorkspaceRepository(db);

beforeAll(async () => {
  await db.insert(user).values([
    {
      id: ownerId,
      name: "Workspace Owner",
      email: `${ownerId}@example.test`,
    },
    {
      id: otherOwnerId,
      name: "Other Owner",
      email: `${otherOwnerId}@example.test`,
    },
  ]);
});

afterAll(async () => {
  await db.delete(user).where(eq(user.id, ownerId));
  await db.delete(user).where(eq(user.id, otherOwnerId));
});

describe("workspace repository", () => {
  test("creates a project with an initial chat and lists it for its owner", async () => {
    const created = await repository.createProject(ownerId, {
      name: "  Product launch  ",
      description: "Release work",
    });

    expect(created.project.name).toBe("Product launch");
    expect(created.chat.projectId).toBe(created.project.id);

    const projects = await repository.listProjects(ownerId);
    expect(projects).toHaveLength(1);
    expect(projects[0]?.chats[0]?.id).toBe(created.chat.id);
    expect(await repository.listProjects(otherOwnerId)).toEqual([]);
  });

  test("enforces owner scope and preserves monotonic message order", async () => {
    const created = await repository.createProject(ownerId, { name: "Secure project" });

    expect(await repository.getChat(otherOwnerId, created.chat.id)).toBeNull();
    expect(
      await repository.renameChat(otherOwnerId, created.chat.id, "Cross-owner rename"),
    ).toBeNull();
    expect(
      (await repository.renameChat(ownerId, created.chat.id, "Owner rename"))?.title,
    ).toBe("Owner rename");

    const first = await repository.appendMessage({
      ownerId,
      chatId: created.chat.id,
      role: "user",
      content: "First",
    });
    const second = await repository.appendMessage({
      ownerId,
      chatId: created.chat.id,
      role: "assistant",
      content: "Second",
      providerId: "openai",
      modelId: "gpt-test",
    });

    expect(first?.sequence).toBe(1);
    expect(second?.sequence).toBe(2);
    expect(
      await repository.appendMessage({
        ownerId: otherOwnerId,
        chatId: created.chat.id,
        role: "user",
        content: "Not allowed",
      }),
    ).toBeNull();

    const chat = await repository.getChat(ownerId, created.chat.id);
    expect(chat?.messages.map((message) => message.content)).toEqual([
      "First",
      "Second",
    ]);
  });

  test("deletes chats and projects only for the owner", async () => {
    const created = await repository.createProject(ownerId, { name: "Disposable" });
    const extraChat = await repository.createChat(ownerId, created.project.id, "Second chat");
    expect(extraChat).not.toBeNull();

    expect(await repository.deleteChat(otherOwnerId, created.chat.id)).toBe(false);
    expect(await repository.deleteChat(ownerId, created.chat.id)).toBe(true);
    expect(await repository.deleteProject(otherOwnerId, created.project.id)).toBe(false);
    expect(await repository.deleteProject(ownerId, created.project.id)).toBe(true);
  });
});
