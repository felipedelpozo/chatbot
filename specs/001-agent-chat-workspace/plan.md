# Implementation Plan: Multi-Provider Agent Chat Workspace

**Branch**: `001-agent-chat-workspace` | **Date**: 2026-09-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-agent-chat-workspace/spec.md`

## Summary

Build a Bun workspace monorepo whose Next.js application reproduces the beUI Chat App workspace,
adds owner-scoped projects and chats, persists conversations in PostgreSQL through Drizzle, protects
them with Better Auth, and streams responses through an application-owned Vercel AI SDK provider
catalog. Each authenticated user manages encrypted external-provider credentials from an in-app
settings panel. The catalog returns only models backed by that user's configured providers; an empty
catalog produces an explicit setup state and disables generation. Every connected provider expands
to a curated list of concrete provider model IDs rather than a single generic family alias.

## Technical Context

**Language/Version**: TypeScript 5.9 strict on Bun 1.3.14 and Node.js 24-compatible runtimes

**Primary Dependencies**: Next.js 16.3.5, React 19, Tailwind CSS 4, beUI Chat App registry source,
Vercel AI SDK 7.0.105, `@ai-sdk/react`, OpenAI/Anthropic/Google AI SDK providers, Better Auth 1.7.5,
Drizzle ORM 0.45.2, Zod, Motion, Lucide

**Storage**: PostgreSQL 18 in Docker Compose, Drizzle migrations, `postgres` 3.4.9 driver

**Testing**: Bun test for domain/data contracts, React Testing Library for components, Playwright for
critical browser flows, clean-database migration smoke test

**Target Platform**: Modern evergreen desktop and mobile browsers; local macOS/Linux development;
containerized PostgreSQL

**Project Type**: Bun monorepo web application

**Performance Goals**: Interactive workspace within two seconds after database readiness; provider
availability reflected on the next server view; sidebar interactions at 60 fps

**Constraints**: No real API key or paid call is used during implementation; strict owner
authorization; encrypted write-only credentials; beUI layout fidelity; responsive down to 360 px;
reduced motion

**Scale/Scope**: Initial single-owner projects, up to 100 projects per account, 1,000 chats per
project, and paginated message histories; team collaboration and production deployment are excluded

## Constitution Check

*GATE: Passed before and after design.*

| Principle | Evidence |
|-----------|----------|
| Spec-driven traceability | FR/SC identifiers map to contracts and tasks. |
| Working vertical slices | Each user story has an independent browser or API test. |
| Secure identity and data | Better Auth owns sessions; repositories require owner ID; FKs are indexed. |
| Provider portability | `packages/ai` owns the catalog and model resolver; UI submits catalog IDs only. |
| Interface fidelity and accessibility | Official beUI registry component is the baseline; desktop/mobile/a11y checks are planned. |
| Evidence before completion | Migration, test, typecheck, lint, build, and browser gates are explicit. |

No constitution violations require justification.

## Architecture Decisions

- `apps/web` owns routes, React Server Components, client interaction islands, and the beUI-derived UI.
- `packages/db` owns schema, migrations, the pooled connection, and owner-scoped repositories.
- `packages/auth` owns Better Auth configuration and server/client entry points.
- `packages/ai` owns external provider/model catalog metadata, credential availability, model
  resolution, and authenticated encryption/decryption helpers.
- The model catalog keeps curated concrete entries per provider. Optional environment overrides are
  prepended and deduplicated, while provider connectivity remains exclusively user-credential based.
- Server components perform initial reads. Route handlers own mutations and streamed chat output.
- Chat clients never send credentials or arbitrary provider endpoints. The dedicated authenticated
  settings boundary accepts a credential once and never returns it.
- `packages/db` stores one encrypted credential envelope per owner/provider. AES-256-GCM additional
  authenticated data binds ciphertext to that owner and provider; key material is derived with HKDF
  from the existing server-only Better Auth secret using a separate credential-encryption context.
- Model availability is calculated from the authenticated owner's credential metadata. Provider
  adapters receive a decrypted key only for the duration of one server-side generation request.
- Catalog responses contain only models whose provider credential exists for the authenticated
  owner. Chats may have no selected provider/model until the first connected model is chosen.
- The sidebar account control uses the installed beUI `MorphPopover` and `AnimatedSidebar`
  primitives. Its menu owns both Settings and logout; no parallel menu library or bespoke popover
  primitive is introduced.
- The conversation header follows the official beUI Chat App composition: `PanelLeft` sidebar
  trigger, title/subtitle stack, and a compact right-aligned status area. Provider readiness is
  derived from owner-scoped external catalog availability. The unconfigured CTA and account menu
  open one shared settings dialog state.
- User messages persist before generation. Assistant messages persist only after successful finish.
- Deletions are explicit, authorized, transactional, and cascade from project to chat to message.
- Message ordering uses creation time plus a monotonic per-chat sequence to avoid timestamp ties.

## Project Structure

### Documentation

```text
specs/001-agent-chat-workspace/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── openapi.yaml
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code

```text
apps/web/
├── src/app/
│   ├── (auth)/
│   ├── (workspace)/projects/[projectId]/chats/[chatId]/
│   └── api/
├── src/components/
│   ├── agents/
│   ├── auth/
│   └── workspace/
├── src/lib/
└── tests/

packages/db/
├── src/schema/
├── src/repositories/
├── src/client.ts
├── src/index.ts
├── drizzle/
└── drizzle.config.ts

packages/auth/
├── src/server.ts
├── src/client.ts
└── src/index.ts

packages/ai/
├── src/catalog.ts
├── src/provider-credentials.ts
├── src/resolve-model.ts
└── src/index.ts

tests/e2e/
docker-compose.yml
playwright.config.ts
package.json
bun.lock
```

**Structure Decision**: A single deployable web application consumes three narrow workspace
packages. This keeps browser/server boundaries explicit without introducing a second API process or
duplicating domain logic.

## Security and Failure Handling

- Every data operation receives the authenticated user ID and includes it in its query predicate.
- Zod validates route parameters and request bodies before database or provider calls.
- Provider availability is derived from owner-scoped credential metadata and returned only as
  booleans plus a short non-secret suffix.
- Credential ciphertext uses random nonces and authenticated encryption. Plaintext exists only in
  the save request and the server-side provider resolution call; it is never logged or read back.
- Credential upserts use the `(owner_id, provider_id)` unique key so concurrent saves converge on one
  current record. Deletion is owner-scoped and leaves message history untouched.
- Logs exclude prompts, message bodies, session cookies, and secrets by default.
- A failed generation preserves the user message and returns a typed recoverable stream error.
- Rate limiting is documented as a production hardening follow-up; local v1 prevents concurrent
  generation within one chat in the client and transactionally serializes message sequencing.

## Migration, Rollback, and Validation

- Generate SQL migrations from the reviewed schema, including the provider credential table; apply
  them both to the current local database and to a clean PostgreSQL 18 database.
- Make chat provider/model selection nullable and clear legacy demo selections; existing messages
  remain untouched and retain historical metadata.
- Rollback for this greenfield release is container/database removal; production destructive rollback
  is out of scope and MUST NOT be inferred from local Docker commands.
- Focused package tests run before root `typecheck`, `lint`, `test`, `build`, and browser checks.
- Live OpenAI, Anthropic, and Google calls remain `UNAVAILABLE` because no real user credential is
  entered during automated validation. Fake values may prove encrypted storage and availability
  transitions but MUST NOT be sent to an external provider.

## Complexity Tracking

No constitution violations or exceptional complexity are present.
