import { and, asc, eq, max, sql } from "drizzle-orm";
import { db, type Database } from "../client";
import { chats, messages, projects } from "../schema";

export interface CreateProjectInput {
  name: string;
  description?: string | null;
}

export interface CreateMessageInput {
  chatId: string;
  ownerId: string;
  role: "user" | "assistant" | "system";
  content: string;
  providerId?: string;
  modelId?: string;
}

function normalizeRequired(value: string) {
  const normalized = value.trim();
  if (!normalized) throw new Error("A non-empty value is required.");
  return normalized;
}

export function createWorkspaceRepository(database: Database = db) {
  return {
    async listProjects(ownerId: string) {
      const projectRows = await database
        .select()
        .from(projects)
        .where(eq(projects.ownerId, ownerId))
        .orderBy(asc(projects.position), asc(projects.createdAt));

      const chatRows = await database
        .select({ chat: chats })
        .from(chats)
        .innerJoin(projects, eq(chats.projectId, projects.id))
        .where(eq(projects.ownerId, ownerId))
        .orderBy(asc(chats.position), asc(chats.createdAt));

      return projectRows.map((project) => ({
        ...project,
        chats: chatRows
          .map(({ chat }) => chat)
          .filter((chat) => chat.projectId === project.id),
      }));
    },

    async createProject(ownerId: string, input: CreateProjectInput) {
      return database.transaction(async (tx) => {
        const [project] = await tx
          .insert(projects)
          .values({
            ownerId,
            name: normalizeRequired(input.name).slice(0, 120),
            description: input.description?.trim().slice(0, 1000) || null,
          })
          .returning();
        if (!project) throw new Error("Project creation failed.");

        const [chat] = await tx
          .insert(chats)
          .values({ projectId: project.id, title: "New conversation" })
          .returning();
        if (!chat) throw new Error("Initial chat creation failed.");

        return { project, chat };
      });
    },

    async createChat(ownerId: string, projectId: string, title = "New conversation") {
      const [ownedProject] = await database
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)))
        .limit(1);
      if (!ownedProject) return null;

      const [chat] = await database
        .insert(chats)
        .values({ projectId, title: normalizeRequired(title).slice(0, 160) })
        .returning();
      return chat ?? null;
    },

    async getChat(ownerId: string, chatId: string) {
      const [row] = await database
        .select({ chat: chats, project: projects })
        .from(chats)
        .innerJoin(projects, eq(chats.projectId, projects.id))
        .where(and(eq(chats.id, chatId), eq(projects.ownerId, ownerId)))
        .limit(1);
      if (!row) return null;

      const messageRows = await database
        .select()
        .from(messages)
        .where(eq(messages.chatId, chatId))
        .orderBy(asc(messages.sequence));
      return { ...row, messages: messageRows };
    },

    async renameProject(ownerId: string, projectId: string, name: string) {
      const [project] = await database
        .update(projects)
        .set({ name: normalizeRequired(name).slice(0, 120), updatedAt: new Date() })
        .where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)))
        .returning();
      return project ?? null;
    },

    async renameChat(ownerId: string, chatId: string, title: string) {
      const [chat] = await database
        .update(chats)
        .set({ title: normalizeRequired(title).slice(0, 160), updatedAt: new Date() })
        .where(
          and(
            eq(chats.id, chatId),
            sql`exists (select 1 from ${projects} where ${projects.id} = ${chats.projectId} and ${projects.ownerId} = ${ownerId})`,
          ),
        )
        .returning();
      return chat ?? null;
    },

    async setChatModel(ownerId: string, chatId: string, providerId: string, modelId: string) {
      const [chat] = await database
        .update(chats)
        .set({ providerId, modelId, updatedAt: new Date() })
        .where(
          and(
            eq(chats.id, chatId),
            sql`exists (select 1 from ${projects} where ${projects.id} = ${chats.projectId} and ${projects.ownerId} = ${ownerId})`,
          ),
        )
        .returning();
      return chat ?? null;
    },

    async deleteProject(ownerId: string, projectId: string) {
      const deleted = await database
        .delete(projects)
        .where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)))
        .returning({ id: projects.id });
      return deleted.length === 1;
    },

    async deleteChat(ownerId: string, chatId: string) {
      const deleted = await database
        .delete(chats)
        .where(
          and(
            eq(chats.id, chatId),
            sql`exists (select 1 from ${projects} where ${projects.id} = ${chats.projectId} and ${projects.ownerId} = ${ownerId})`,
          ),
        )
        .returning({ id: chats.id });
      return deleted.length === 1;
    },

    async appendMessage(input: CreateMessageInput) {
      return database.transaction(async (tx) => {
        const [ownedChat] = await tx
          .select({ id: chats.id })
          .from(chats)
          .innerJoin(projects, eq(chats.projectId, projects.id))
          .where(and(eq(chats.id, input.chatId), eq(projects.ownerId, input.ownerId)))
          .limit(1);
        if (!ownedChat) return null;

        await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${input.chatId}))`);
        const [latest] = await tx
          .select({ sequence: max(messages.sequence) })
          .from(messages)
          .where(eq(messages.chatId, input.chatId));
        const sequence = (latest?.sequence ?? 0) + 1;

        const [message] = await tx
          .insert(messages)
          .values({
            chatId: input.chatId,
            sequence,
            role: input.role,
            content: normalizeRequired(input.content).slice(0, 32_000),
            providerId: input.providerId,
            modelId: input.modelId,
          })
          .returning();

        await tx.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, input.chatId));
        return message ?? null;
      });
    },
  };
}

export const workspaceRepository = createWorkspaceRepository();

