# Research: Multi-Provider Agent Chat Workspace

## Framework and workspace

**Decision**: Use Next.js 16.3.5 App Router in `apps/web` under a Bun workspace root.

**Rationale**: `create-next-app@latest` resolved to 16.3.5 on 2026-09-17. Bun 1.3.14 supports the
workspace and script requirements while Next remains compatible with Node-hosted deployments.

**Alternatives considered**: A single-package Next app was rejected because the user explicitly
requested a monorepo. A separate API service was rejected as unnecessary for the first vertical slice.

## beUI fidelity

**Decision**: Install the official `@beui/chat-app` shadcn registry source and adapt data bindings,
not its visual hierarchy.

**Rationale**: The live reference exposes a 17rem project sidebar, nested project/chat rows, focused
header, message navigation, agent activity/cards, and a prompt composer with model selection. Using
the registry source is the highest-fidelity and most maintainable baseline.

**Alternatives considered**: Recreating the screen from a screenshot was rejected because it would
needlessly diverge from the distributed component.

## Design token plan

**Decision**: Preserve beUI's quiet neutral system: canvas `#ffffff`, sidebar `#fafafa`, selected
surface `#f1f1f1`, border `#e7e7e7`, primary ink `#171717`, secondary ink `#737373`, connected
status `#10b981`. Use Geist Sans for interface text and Geist Mono for commands/model metadata.

**Rationale**: The reference is intentionally restrained; the nested project tree and long-form
conversation are its signature. Extra decoration would reduce fidelity.

**Alternatives considered**: A branded gradient or dark-first treatment was rejected because the
brief requires the exact beUI interface rather than a visual remix.

## AI orchestration

**Decision**: Use AI SDK 7 through an application-owned catalog with OpenAI, Anthropic, and Google.
Return only entries whose provider is configured for the authenticated user, and use one streamed
UI-message contract for every model.

**Rationale**: Provider SDKs implement a shared language-model interface. The catalog prevents
client-controlled endpoints and keeps availability, labels, and capability metadata consistent.

**Alternatives considered**: Direct provider REST calls were rejected because they duplicate stream
handling and weaken portability. A provider-specific route per vendor was rejected as unnecessary.

## Authentication

**Decision**: Use Better Auth 1.7.5 email/password sessions with its Drizzle adapter and catch-all
Next.js route. Application repositories receive the resolved session user ID explicitly.

**Rationale**: Better Auth is the requested identity authority and supports the selected database.
Explicit owner predicates make authorization auditable and testable.

**Alternatives considered**: Custom JWT auth and middleware-only authorization were rejected because
they duplicate security-sensitive behavior and can miss server-side data paths.

## Persistence

**Decision**: Use Drizzle ORM 0.45.2 with the `postgres` driver, generated migrations, indexed foreign
keys, UUID primary keys, and per-chat message sequence values.

**Rationale**: The driver is simple for a long-running Next server, generated SQL is reviewable, and
message sequences guarantee deterministic ordering.

**Alternatives considered**: Database `push` was rejected as the normal workflow because it provides
weaker migration history. JSON documents were rejected because ownership and ordering are relational.

## Local infrastructure

**Decision**: Docker Compose runs PostgreSQL 18 with a health check and named volume. Root Bun scripts
wrap start, stop, migration, seed, and validation commands.

**Rationale**: This gives repeatable local persistence while keeping the web process fast to iterate.

**Alternatives considered**: Bundling the web app into Docker for development was rejected because it
slows feedback and is not required by the brief.

## Personal provider credential custody

**Decision**: Store one authenticated-encryption envelope per user and external provider. Use
AES-256-GCM with a random nonce, bind the owner/provider tuple as additional authenticated data, and
derive a separate encryption key from the server-only Better Auth secret through HKDF.

**Rationale**: Credentials remain isolated by both database predicates and cryptographic context,
while the existing high-entropy server secret avoids introducing an unmanaged second local secret.
The plaintext exists only while handling a save or generation request and is never returned.

**Alternatives considered**: Plaintext database storage was rejected as unsafe. Browser storage was
rejected because it exposes secrets to client script and cannot support server-side generation.
Environment variables were rejected as the primary path because they share one key across users.

## Credential verification and display

**Decision**: Saving proves encrypted custody, not provider validity. Return only configured state,
the last four characters, and update time; never perform a provider call during save.

**Rationale**: Validation calls can cost money, trigger rate limits, or leak account behavior. A
masked suffix lets users distinguish keys without making the secret recoverable through the UI.

**Alternatives considered**: A “test key” call on save was rejected because paid provider work must
remain explicit. Returning the full key after save was rejected because it expands exposure.

## User-scoped model routing

**Decision**: Keep model identifiers and optional model-name overrides in the application catalog,
but derive availability from the current user's credential records. Resolve and decrypt the matching
credential immediately before constructing the AI SDK provider adapter.

**Rationale**: The selector remains provider-portable while preventing one user from inheriting
another user's configuration or mistaking an unavailable or local demo entry for a connected model.

**Alternatives considered**: A global credential fallback was rejected because it violates personal
ownership. Sending keys with chat requests was rejected because it broadens the secret boundary.

## Concrete provider model catalog

**Decision**: Publish three concrete text/chat model IDs for each supported connected provider,
using the providers' current official model documentation as the source for identifiers. OpenAI uses
GPT-5.6, GPT-5.6 Terra, and GPT-5.6 Luna; Anthropic uses Claude Sonnet 5, Claude Opus 5, and Claude
Haiku 4.5; Google uses Gemini 3.1 Pro Preview, Gemini 3 Flash Preview, and Gemini 2.5 Flash. Optional
environment overrides are prepended as the provider preference and deduplicated by exact model ID.

**Rationale**: A provider connection grants access to a family of models, not one opaque alias.
Concrete IDs make selection meaningful, preserve server-side allowlisting, and continue to route all
vendors through the same Vercel AI SDK language-model contract.

**Alternatives considered**: Runtime provider model-discovery calls were rejected because they add
latency, credential exposure, and provider-specific failure paths to a deterministic selector. One
generic family row per provider was rejected because it does not satisfy multi-model selection.
