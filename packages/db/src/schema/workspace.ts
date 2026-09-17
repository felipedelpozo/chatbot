import { relations } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth";

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("projects_owner_id_idx").on(table.ownerId),
    check("projects_position_nonnegative", sql`${table.position} >= 0`),
  ],
);

export const chats = pgTable(
  "chats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 160 }).notNull(),
    providerId: varchar("provider_id", { length: 40 }),
    modelId: varchar("model_id", { length: 120 }),
    position: integer("position").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("chats_project_id_idx").on(table.projectId),
    check("chats_position_nonnegative", sql`${table.position} >= 0`),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    chatId: uuid("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    sequence: integer("sequence").notNull(),
    role: text("role").notNull(),
    content: text("content").notNull(),
    status: text("status").default("complete").notNull(),
    providerId: varchar("provider_id", { length: 40 }),
    modelId: varchar("model_id", { length: 120 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("messages_chat_id_idx").on(table.chatId),
    uniqueIndex("messages_chat_sequence_unique").on(table.chatId, table.sequence),
    check("messages_sequence_positive", sql`${table.sequence} > 0`),
    check("messages_role_valid", sql`${table.role} in ('user', 'assistant', 'system')`),
    check("messages_status_valid", sql`${table.status} in ('complete', 'failed')`),
  ],
);

export const providerCredentials = pgTable(
  "provider_credentials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    providerId: varchar("provider_id", { length: 40 }).notNull(),
    ciphertext: text("ciphertext").notNull(),
    initializationVector: text("initialization_vector").notNull(),
    authenticationTag: text("authentication_tag").notNull(),
    encryptionVersion: integer("encryption_version").default(1).notNull(),
    credentialHint: varchar("credential_hint", { length: 8 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("provider_credentials_owner_id_idx").on(table.ownerId),
    uniqueIndex("provider_credentials_owner_provider_unique").on(
      table.ownerId,
      table.providerId,
    ),
    check(
      "provider_credentials_provider_valid",
      sql`${table.providerId} in ('openai', 'anthropic', 'google')`,
    ),
    check(
      "provider_credentials_encryption_version_positive",
      sql`${table.encryptionVersion} > 0`,
    ),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  projects: many(projects),
  providerCredentials: many(providerCredentials),
}));

export const projectRelations = relations(projects, ({ one, many }) => ({
  owner: one(user, { fields: [projects.ownerId], references: [user.id] }),
  chats: many(chats),
}));

export const chatRelations = relations(chats, ({ one, many }) => ({
  project: one(projects, { fields: [chats.projectId], references: [projects.id] }),
  messages: many(messages),
}));

export const messageRelations = relations(messages, ({ one }) => ({
  chat: one(chats, { fields: [messages.chatId], references: [chats.id] }),
}));

export const providerCredentialRelations = relations(
  providerCredentials,
  ({ one }) => ({
    owner: one(user, {
      fields: [providerCredentials.ownerId],
      references: [user.id],
    }),
  }),
);
