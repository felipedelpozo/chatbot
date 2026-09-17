# Tasks: Multi-Provider Agent Chat Workspace

**Input**: Design documents from `specs/001-agent-chat-workspace/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Required by the project constitution for domain behavior, authorization, provider routing,
API contracts, and critical browser journeys.

## Phase 1: Setup

- [x] T001 Create Bun workspace manifests and root validation scripts in `package.json`, `tsconfig.json`, and `bunfig.toml`
- [x] T002 Scaffold the Next.js 16 App Router application with Tailwind CSS 4 in `apps/web/`
- [x] T003 [P] Configure Docker PostgreSQL and environment documentation in `docker-compose.yml`, `.dockerignore`, and `.env.example`
- [x] T004 [P] Document repository operation and product setup in `README.md` and `AGENTS.md`

## Phase 2: Foundational

- [x] T005 Create shared workspace package manifests and exports in `packages/db/`, `packages/auth/`, and `packages/ai/`
- [x] T006 Implement Drizzle application and Better Auth schemas with indexed foreign keys in `packages/db/src/schema/`
- [x] T007 Generate and review the initial migration in `packages/db/drizzle/`
- [x] T008 [P] Implement validated environment loading in `apps/web/src/lib/env.ts` and package server entry points
- [x] T009 Implement Better Auth Drizzle configuration, browser client, and catch-all route in `packages/auth/src/` and `apps/web/src/app/api/auth/[...all]/route.ts`
- [x] T010 Implement owner-scoped project/chat/message repositories and unit tests in `packages/db/src/repositories/` and `packages/db/tests/`
- [x] T011 Implement provider catalog, availability, resolver, deterministic demo path, and unit tests in `packages/ai/src/` and `packages/ai/tests/`

## Phase 3: User Story 1 - Work in a project chat (P1) MVP

**Goal**: Persist and stream a complete project conversation in the beUI workspace.

**Independent Test**: Send a prompt with the demo provider, observe streaming, refresh, and confirm
both messages remain ordered.

- [x] T012 [P] [US1] Add chat request validation and stream contract tests in `apps/web/tests/chat-api.test.ts`
- [x] T013 [P] [US1] Install and adapt the official beUI Chat App registry source in `apps/web/src/components/agents/`
- [x] T014 [US1] Implement the authenticated workspace route and server data loading in `apps/web/src/app/(workspace)/projects/[projectId]/chats/[chatId]/page.tsx`
- [x] T015 [US1] Implement the AI SDK chat route with pre-generation user persistence and successful assistant persistence in `apps/web/src/app/api/chat/route.ts`
- [x] T016 [US1] Bind the beUI composer, streaming message state, model selection, errors, and responsive sidebar in `apps/web/src/components/workspace/chat-workspace.tsx`
- [x] T017 [US1] Add empty, loading, generation error, and reduced-motion states in `apps/web/src/components/workspace/`

## Phase 4: User Story 2 - Organize projects and chats (P2)

**Goal**: Create, rename, select, and delete owner-scoped projects and nested chats.

**Independent Test**: Create a project and two chats, rename and select them, refresh, then delete one
chat and confirm hierarchy and route consistency.

- [x] T018 [P] [US2] Add project and chat API authorization/validation tests in `apps/web/tests/workspace-api.test.ts`
- [x] T019 [US2] Implement project and chat route handlers in `apps/web/src/app/api/projects/` and `apps/web/src/app/api/chats/`
- [x] T020 [US2] Implement beUI sidebar project/chat actions and optimistic navigation in `apps/web/src/components/workspace/project-sidebar.tsx`
- [x] T021 [US2] Add project/chat empty and delete-confirmation states in `apps/web/src/components/workspace/`

## Phase 5: User Story 3 - Choose a provider and model (P3)

**Goal**: Expose the controlled multi-provider catalog and record the selected model on responses.

**Independent Test**: Switch catalog entries, send demo prompts, and verify stored provider/model
metadata while unavailable live entries remain disabled.

- [x] T022 [P] [US3] Add model catalog route tests and unknown-model rejection coverage in `apps/web/tests/models-api.test.ts`
- [x] T023 [US3] Implement the model catalog route and server-only credential availability in `apps/web/src/app/api/models/route.ts`
- [x] T024 [US3] Integrate grouped provider/model selection with the beUI composer in `apps/web/src/components/workspace/model-selector.tsx`

## Phase 6: User Story 4 - Manage an account session (P4)

**Goal**: Register, sign in, sign out, and protect all private workspace routes.

**Independent Test**: Register, access owned data, sign out, and confirm private route/API denial.

- [x] T025 [P] [US4] Add session and protected-route tests in `apps/web/tests/auth.test.ts`
- [x] T026 [US4] Implement beUI-aligned sign-up and sign-in screens in `apps/web/src/app/(auth)/` and `apps/web/src/components/auth/`
- [x] T027 [US4] Implement server-side workspace guards, safe return paths, and account menu sign-out in `apps/web/src/lib/session.ts` and `apps/web/src/components/workspace/account-menu.tsx`

## Phase 7: Polish and Cross-Cutting Validation

- [x] T028 [P] Add deterministic seed/demo helpers and database setup scripts in `packages/db/src/seed.ts` and root `package.json`
- [x] T029 [P] Add Playwright critical-flow coverage and accessibility assertions in `tests/e2e/`
- [x] T030 Verify and repair responsive desktop/mobile visual fidelity against beUI using browser screenshots
- [x] T031 Run clean-database migration, typecheck, lint, unit/integration tests, production build, and browser validation from `quickstart.md`
- [x] T032 Review the final diff, scan for secrets, update documentation, and record convergence evidence in `specs/001-agent-chat-workspace/convergence.md`

## Phase 8: Convergence

- [x] T033 Record the clean-database, repository gate, browser, accessibility, secret-scan, and unavailable live-provider evidence in `specs/001-agent-chat-workspace/convergence.md` per FR-014, FR-015, and SC-007 (partial)

## Phase 9: Personal Provider Credential Foundation

- [x] T034 Update provider credential research, data model, API contract, and validation guide in `specs/001-agent-chat-workspace/`
- [x] T035 Add the owner-scoped provider credential schema and generated migration in `packages/db/src/schema/workspace.ts` and `packages/db/drizzle/`
- [x] T036 [P] Add authenticated encryption helpers and round-trip/tamper tests in `packages/ai/src/provider-credentials.ts` and `packages/ai/tests/provider-credentials.test.ts`
- [x] T037 Add owner-scoped credential upsert/read/delete repositories and isolation tests in `packages/db/src/repositories/provider-credentials.ts` and `packages/db/tests/provider-credentials.test.ts`
- [x] T038 Refactor the model catalog and AI SDK resolver to use user-scoped availability and ephemeral keys in `packages/ai/src/catalog.ts`, `packages/ai/src/resolve-model.ts`, and `packages/ai/tests/catalog.test.ts`

## Phase 10: User Story 5 - Configure Personal AI Providers (P3)

**Goal**: Let each authenticated user securely add, replace, inspect masked status for, and remove
their own OpenAI, Anthropic, and Google credential.

**Independent Test**: Save a synthetic credential for one account, verify encrypted owner isolation
and masked status, confirm its models become available only for that user, then replace and remove it.

- [x] T039 [P] [US5] Add provider settings route authorization, validation, and redaction tests in `apps/web/tests/provider-settings-api.test.ts`
- [x] T040 [US5] Implement authenticated provider status and credential mutation routes in `apps/web/src/app/api/providers/`
- [x] T041 [US5] Resolve user-scoped catalog availability and credentials in `apps/web/src/app/api/models/route.ts`, `apps/web/src/app/api/chat/route.ts`, and authenticated workspace pages
- [x] T042 [US5] Build the responsive accessible provider settings panel in `apps/web/src/components/workspace/provider-settings-dialog.tsx`
- [x] T043 [US5] Connect sidebar settings, masked status refresh, and model-selector updates in `apps/web/src/components/workspace/project-sidebar.tsx` and workspace components

## Phase 11: Provider Credential Validation and Documentation

- [x] T044 [P] Extend Playwright coverage for personal credential save, replacement, isolation, removal, and accessibility in `tests/e2e/workspace.spec.ts`
- [x] T045 Remove global provider-key setup guidance and document personal provider settings in `.env.example`, `README.md`, and `specs/001-agent-chat-workspace/quickstart.md`
- [x] T046 Run migration checks, typecheck, lint, unit/integration tests, build, E2E, secret scan, and append provider credential evidence to `specs/001-agent-chat-workspace/convergence.md`

## Dependencies & Execution Order

- Setup precedes all other work.
- Foundational database, auth, and provider contracts precede user stories.
- US1 is the MVP and establishes the workspace shell and stream contract.
- US2 and US3 can proceed independently after the shell and repositories exist.
- US4 depends on foundational auth but not on US2 or US3.
- Final browser and repository-wide gates run only after all selected stories are integrated.
- T035-T038 form the sequential credential foundation. T039 can be authored in parallel after the
  contracts are stable; T040-T043 integrate sequentially across shared server/client boundaries.
- US5 depends on Better Auth, the provider catalog, and the credential foundation, but it preserves
  the demo-provider journey independently.

## Parallel Opportunities

- T003 and T004 are independent documentation/infrastructure work.
- T008 can proceed after package boundaries exist while schemas and catalog are implemented.
- Contract tests marked `[P]` touch disjoint files and can be authored in parallel.
- T028 and T029 are parallel after the corresponding runtime paths exist.
- T036 and T039 touch disjoint package and web-test files after T034 and may proceed in parallel.

## Implementation Strategy

Deliver T001-T017 as the first demonstrable vertical slice, validate it with the deterministic model,
then add organization, provider selection, and authentication UI in priority order. Do not use live
paid provider calls during implementation without a separate explicit credential decision.

The personal-provider amendment delivers T034-T043 as one secure vertical slice, then completes
T044-T046. Synthetic credentials prove custody and availability only; no external call is authorized.

## Phase 12: beUI Account Submenu

- [x] T047 Move Settings out of primary navigation and place it beside logout in a bottom account
  submenu using the existing beUI `MorphPopover` and `AnimatedSidebar` components in
  `apps/web/src/components/workspace/account-menu.tsx` and
  `apps/web/src/components/workspace/project-sidebar.tsx`
- [x] T048 Update the browser journey for keyboard-accessible account-menu Settings and logout
  behavior on desktop and mobile in `tests/e2e/workspace.spec.ts`
- [x] T049 Run typecheck, lint, tests, build, E2E, visual inspection, accessibility validation, and
  update convergence evidence in `specs/001-agent-chat-workspace/convergence.md`

## Phase 13: beUI Header and Provider Readiness

- [x] T050 Rebuild the conversation header from the official beUI Chat App composition and remove
  non-reference share/action controls in `apps/web/src/components/workspace/chat-workspace.tsx`
- [x] T051 Derive header readiness from personal external-provider availability and add an
  unconfigured explanation plus direct Settings CTA using one shared provider dialog state across
  `apps/web/src/components/workspace/chat-workspace.tsx`,
  `apps/web/src/components/workspace/project-sidebar.tsx`, and
  `apps/web/src/components/workspace/workspace-empty.tsx`
- [x] T052 Extend Playwright coverage for the unconfigured header, configuration CTA, configured
  transition, and removal transition in `tests/e2e/workspace.spec.ts`
- [x] T053 Run repository gates and visual design QA against the supplied beUI header reference,
  record the result in `design-qa.md`, and update
  `specs/001-agent-chat-workspace/convergence.md`

## Phase 14: Connected-Provider-Only Catalog

- [x] T054 Amend the constitution, specification, plan, research, data model, contract, and local
  guidance to remove the demo-provider product path and require connected-provider-only models
- [x] T055 Add catalog, API, and Playwright regression coverage proving that an unconfigured user
  sees no demo or unavailable models and a configured user sees only connected provider groups
- [x] T056 Remove the demo catalog and streaming route, reject all selections without an
  owner-scoped provider credential, and keep provider resolution server-only in `packages/ai/` and
  `apps/web/src/app/api/chat/route.ts`
- [x] T057 Make chat model selection nullable, generate and validate the migration that clears
  legacy demo selections, and preserve historical message metadata in `packages/db/`
- [x] T058 Update the beUI model selector and composer empty state so generation is disabled until a
  connected provider model exists and Settings remains the recovery path
- [x] T059 Run repository gates, desktop/mobile browser validation, visual design QA, secret scan,
  and update convergence evidence for the connected-provider-only catalog

## Phase 15: Concrete Multi-Model Provider Catalog

- [x] T060 Amend the specification, plan, research, data model, API contract, and local guidance to
  require multiple concrete model entries for every connected provider
- [x] T061 Add catalog regression tests for concrete entries, provider filtering, one global default,
  environment override preference, and override deduplication
- [x] T062 Implement curated OpenAI, Anthropic, and Google model definitions with server-controlled
  IDs, labels, descriptions, and backward-compatible optional overrides in `packages/ai/src/catalog.ts`
- [x] T063 Update browser assertions and capture the connected OpenAI selector with multiple models
- [x] T064 Run repository gates, visual design QA, secret scan, and append convergence evidence for
  the concrete multi-model catalog
