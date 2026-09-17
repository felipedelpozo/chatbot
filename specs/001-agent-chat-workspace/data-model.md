# Data Model: Multi-Provider Agent Chat Workspace

## Better Auth entities

Better Auth owns `user`, `session`, `account`, and `verification`. Their exact fields follow the
installed Better Auth Drizzle adapter contract. Application tables reference `user.id` and do not
duplicate credentials or session state.

## Project

| Field | Type | Rules |
|------|------|-------|
| id | UUID | Primary key, generated |
| ownerId | Text | Required FK to user, indexed |
| name | Varchar(120) | Trimmed, 1-120 characters |
| description | Text | Optional, maximum 1,000 characters |
| position | Integer | Non-negative, default 0 |
| createdAt | Timestamp | Required, database default |
| updatedAt | Timestamp | Required, refreshed on mutation |

Relationship: one owner has many projects; one project has many chats. Deleting a project cascades
to its chats and messages after an authorized explicit request.

## Chat

| Field | Type | Rules |
|------|------|-------|
| id | UUID | Primary key, generated |
| projectId | UUID | Required FK to project, indexed |
| title | Varchar(160) | Trimmed, 1-160 characters |
| providerId | Varchar(40) | Nullable selected external provider identifier |
| modelId | Varchar(120) | Nullable selected external model identifier |
| position | Integer | Non-negative, default 0 |
| createdAt | Timestamp | Required, database default |
| updatedAt | Timestamp | Required, refreshed on message or rename |

Relationship: one project has many ordered chats. Ownership is resolved through the parent project,
and every repository query includes the project owner.

## Message

| Field | Type | Rules |
|------|------|-------|
| id | UUID | Primary key, generated |
| chatId | UUID | Required FK to chat, indexed |
| sequence | Integer | Required, positive, unique within chat |
| role | Text | One of `user`, `assistant`, `system` |
| content | Text | Trimmed, 1-32,000 characters |
| status | Text | One of `complete`, `failed` |
| providerId | Varchar(40) | Required for assistant, otherwise null |
| modelId | Varchar(120) | Required for assistant, otherwise null |
| createdAt | Timestamp | Required, database default |

Constraints: `(chat_id, sequence)` is unique. User messages are inserted before generation.
Assistant messages are inserted only after complete generation. Failure details are not stored in
message content.

## Provider catalog entry

This is configuration, not a database table.

| Field | Type | Rules |
|------|------|-------|
| id | String | Stable client-facing catalog ID |
| providerId | String | `openai`, `anthropic`, or `google` |
| modelId | String | Provider model identifier |
| label | String | Human-readable model label |
| description | String | Short capability summary |
| isAvailable | Boolean | Always true for returned entries; derived from owner configuration |
| isDefault | Boolean | True for exactly one returned connected model |

Each configured provider expands to multiple curated concrete model entries. A non-empty optional
environment override is inserted first for its provider and deduplicated against the curated IDs.
Provider connection state is never inferred from the override.

## Provider credential

| Field | Type | Rules |
|------|------|-------|
| id | UUID | Primary key, generated |
| ownerId | Text | Required FK to user, indexed, cascade on account deletion |
| providerId | Varchar(40) | One of `openai`, `anthropic`, or `google` |
| ciphertext | Text | Required authenticated ciphertext; never returned by read APIs |
| initializationVector | Text | Required random nonce encoded for storage |
| authenticationTag | Text | Required integrity tag encoded for storage |
| encryptionVersion | Integer | Required, starts at 1 |
| credentialHint | Varchar(8) | Last four characters only |
| createdAt | Timestamp | Required, database default |
| updatedAt | Timestamp | Required, refreshed on replacement |

Constraints: `(owner_id, provider_id)` is unique and `owner_id` is indexed. Repository reads and
mutations always include the owner. The encrypted envelope is authenticated against both owner and
provider so moving ciphertext to a different row fails decryption.

## State transitions

```text
user submits prompt
  -> user message complete
  -> provider stream starts
      -> success -> assistant message complete
      -> failure -> typed stream error; no completed assistant message
```

Project and chat records have no soft-delete state in v1. Delete operations are transactional and
authorized immediately before mutation.

```text
provider unconfigured
  -> save credential -> configured
  -> replace credential -> configured with new hint and timestamp
  -> remove credential -> unconfigured
```

Credential removal does not alter chats or messages. A generation request resolves one credential
snapshot before provider invocation; later replacement or removal affects subsequent requests.
