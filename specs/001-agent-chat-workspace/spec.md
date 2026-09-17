# Feature Specification: Multi-Provider Agent Chat Workspace

**Feature Branch**: `001-agent-chat-workspace`

**Created**: 2026-09-17

**Status**: Approved

**Input**: User description: "Create a current Next.js application in a Bun monorepo with the beUI Chat App interface, Vercel AI SDK, multiple providers and models, Drizzle/PostgreSQL with Docker, Better Auth, projects and project chats, full GitHub Spec Kit definition, and subagents restricted to GPT 5.6 Luna or DeepSeek."

**Amendment**: User description: "API keys must be managed per user through a configuration panel."

**Amendment**: User description: "Use only existing beUI components and place Settings in the
account submenu beside logout at the bottom of the sidebar."

**Amendment**: User description: "Match the beUI app header and never show Connected when no
provider account is configured; explain the missing setup and provide a direct configuration action."

**Amendment**: User description: "Remove Demo and show only models from connected providers."

**Amendment**: User description: "The selector must show the actual models available for each
connected provider, not one generic provider-family alias."

## Clarifications

### Session 2026-09-17

- Q: Which initial ownership model applies to projects? → A: Single authenticated owner.
- Q: How is the product validated without paid provider calls? → A: Automated catalog, persistence,
  authorization, and UI-state tests use synthetic credentials without invoking a provider; live
  generation remains unavailable until a real credential and explicit call authorization exist.
- Q: Which initial sign-in method is required? → A: Email and password.
- Q: What happens when a project is deleted? → A: Its chats and messages are deleted transactionally after explicit confirmation.
- Q: Who owns provider credentials? → A: Each authenticated user manages one private credential per external provider from a configuration panel; no shared global credential is used.
- Q: Can a saved credential be shown again? → A: No. Credentials are write-only after submission and only masked status metadata is returned.
- Q: Where is provider configuration opened from? → A: From the beUI account submenu at the
  bottom of the sidebar, alongside logout; Settings is not a primary navigation action.
- Q: What does the header provider state represent? → A: It is derived from the authenticated
  user's external-provider credentials, and an unconfigured state includes a direct Settings action.
- Q: Which models appear in the composer? → A: Only models belonging to providers configured by the
  authenticated user. Demo and unconfigured-provider entries are not rendered. With no configured
  provider, the model control and composer remain disabled and point the user to Settings.
- Q: How are models represented inside a connected provider group? → A: As multiple concrete,
  server-controlled provider model IDs with individual names and descriptions. Optional local model
  overrides are added as the preferred entry without replacing or duplicating the curated models.

## User Scenarios & Testing

### User Story 1 - Work in a project chat (Priority: P1)

An authenticated user opens a workspace that matches the referenced beUI Chat App, selects a
project and one of its chats, reads the persisted conversation, sends a prompt, and sees the
assistant response stream into the same chat.

**Why this priority**: It is the product's primary value and proves interface, identity,
persistence, and AI orchestration as one vertical slice.

**Independent Test**: Sign in, open a seeded project chat, confirm the no-provider recovery state,
configure a provider credential, and verify that its model becomes the only selectable provider
group. Message ordering is verified through the repository contract without a paid provider call.

**Acceptance Scenarios**:

1. **Given** an authenticated user with a project and chat, **When** the chat is opened, **Then**
   its messages, title, connection state, and composer appear in the beUI workspace composition.
2. **Given** an open chat and selected model, **When** the user sends valid text, **Then** the user
   message is persisted immediately and the assistant response streams and is persisted on finish.
3. **Given** a provider error, **When** generation fails, **Then** the saved user message remains,
   a recoverable error is shown, and no incomplete assistant message is presented as complete.

---

### User Story 2 - Organize projects and chats (Priority: P2)

An authenticated user creates, renames, and removes projects and creates, renames, selects, and
removes chats within each project from the workspace sidebar.

**Why this priority**: Projects are the durable organizing boundary requested by the user and are
required for a useful multi-conversation workspace.

**Independent Test**: Create a project with two chats, rename both, refresh, delete one chat, and
confirm the remaining hierarchy and selected route are correct.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** a project is created, **Then** it appears in the
   sidebar with an initial chat and becomes the active destination.
2. **Given** a project containing chats, **When** a chat is selected, **Then** the URL and
   conversation update without exposing another user's data.
3. **Given** the last chat in a project, **When** deletion is requested, **Then** the interface
   clearly explains the resulting empty project and offers creation of a new chat.

---

### User Story 3 - Choose a provider and model (Priority: P3)

An authenticated user chooses from available providers and models in the composer, with only
server-configured options presented as usable.

**Why this priority**: Multi-provider and multi-model support is an explicit product requirement,
and the selector must accurately represent the current user's configured provider accounts.

**Independent Test**: Configure one provider at a time with synthetic credentials, verify that only
its catalog group is exposed, switch to a second configured provider, and confirm both groups are
available without submitting a paid generation request.

**Acceptance Scenarios**:

1. **Given** one or more configured providers, **When** the selector opens, **Then** only their
   concrete models are grouped by provider; each connected group contains multiple selectable model
   IDs, and no demo, generic family alias, or unconfigured-provider entry is present.
2. **Given** a selected model, **When** a prompt succeeds, **Then** the response records the exact
   provider and model used.
3. **Given** an unknown or disabled model submitted directly, **When** the server validates the
   request, **Then** it rejects the request without calling a provider.

---

### User Story 4 - Manage an account session (Priority: P4)

A visitor can create an account, sign in, sign out, and return to the intended workspace after
authentication.

**Why this priority**: Identity protects project data and makes persistence meaningful.

**Independent Test**: Register with email and password, sign out, sign in again, and verify access
to the same projects while unauthenticated access redirects to sign-in.

**Acceptance Scenarios**:

1. **Given** a visitor, **When** valid account details are submitted, **Then** an authenticated
   session is created and the visitor is redirected to the workspace.
2. **Given** an unauthenticated request for a project or chat, **When** authorization runs, **Then**
   no private data is returned and the UI redirects to sign-in.

---

### User Story 5 - Configure personal AI providers (Priority: P3)

An authenticated user opens provider settings, adds or replaces their own API credential for an
external provider, sees which providers are ready, and removes credentials they no longer want the
workspace to use.

**Why this priority**: Personal credential custody is required for real multi-provider use without
sharing secrets between accounts.

**Independent Test**: Save a credential for one user, confirm only masked status is returned, verify
the matching models become available only for that user, replace and remove it, and confirm another
user never sees or uses it.

**Acceptance Scenarios**:

1. **Given** an authenticated user, **When** they open the account submenu at the bottom of the
   sidebar and choose Settings, then save a supported provider credential, **Then** the interface
   reports that provider as configured without displaying the secret.
2. **Given** two authenticated users, **When** only one configures a provider, **Then** models for
   that provider are available only to that owner and generation resolves only that owner's secret.
3. **Given** a configured provider, **When** its credential is replaced or removed, **Then** model
   availability updates immediately while existing conversation history remains unchanged.
4. **Given** an invalid, empty, oversized, or unsupported provider credential request, **When** it is
   submitted, **Then** the request is rejected without storing or logging the submitted value.

### Edge Cases

- Empty projects show a focused create-chat action instead of a blank conversation.
- Empty chats show the beUI composer and a clear first-prompt invitation.
- Duplicate submissions are prevented while a response is streaming.
- Empty, whitespace-only, over-limit, unknown-model, and cross-owner requests are rejected.
- Refreshing during a stream restores completed persisted messages and does not invent completion.
- Database or provider unavailability produces actionable, non-sensitive errors.
- Credential values are never returned after submission, included in logs, or exposed through model
  catalog responses, errors, page source, or client state after the save request completes.
- Concurrent saves for the same user and provider result in one current credential rather than
  duplicate active records.
- Removing a credential during an in-flight generation does not alter persisted conversation
  history; the active request either completes with its already-resolved credential or fails safely.
- Narrow screens fold the sidebar off-canvas while preserving all project and chat actions.
- Reduced-motion preferences disable nonessential transitions without removing state feedback.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST provide account registration, sign-in, sign-out, and durable sessions.
- **FR-002**: The system MUST authorize every project, chat, and message read or mutation against
  the authenticated owner on the server.
- **FR-003**: Users MUST be able to create, view, rename, and delete projects.
- **FR-004**: Users MUST be able to create, view, rename, select, and delete chats within projects.
- **FR-005**: The system MUST persist ordered user and assistant messages within their chat.
- **FR-006**: The workspace MUST reproduce the referenced beUI Chat App's information hierarchy,
  controls, spacing, responsive sidebar behavior, conversation surface, prompt composer, and
  title/subtitle/status header composition.
- **FR-007**: Users MUST be able to choose an available provider and model before sending a prompt.
- **FR-008**: The server MUST validate provider and model selections against a controlled catalog.
  Chat requests MUST never accept provider credentials; only the dedicated authenticated provider
  settings boundary may receive a credential value.
- **FR-009**: The system MUST stream assistant responses and persist a completed response with the
  provider and model metadata used for generation.
- **FR-010**: The model catalog and composer MUST expose only models backed by the authenticated
  user's configured personal provider credentials. No demo or unavailable provider entry may be
  displayed or accepted for generation; with an empty catalog the composer MUST remain disabled and
  provide a direct recovery path to provider settings.
- **FR-011**: The system MUST support OpenAI, Anthropic, and Google provider adapters when the
  authenticated user has configured the corresponding personal credential.
- **FR-012**: Project and chat mutations MUST return validation, authorization, conflict, and
  dependency failures as distinct recoverable outcomes.
- **FR-013**: The interface MUST support keyboard navigation, visible focus, semantic labels,
  mobile layouts, and reduced-motion preferences.
- **FR-014**: The repository MUST include reproducible local database startup, migration, seed,
  test, lint, typecheck, build, and browser validation instructions.
- **FR-015**: GitHub Spec Kit artifacts MUST define requirements, decisions, data model, contracts,
  tasks, analysis, and convergence evidence for the feature.
- **FR-016**: Authenticated users MUST be able to add, replace, inspect masked status for, and remove
  one personal credential for each supported external provider. Settings MUST be reached from the
  beUI account submenu beside logout at the bottom of the sidebar rather than primary navigation.
- **FR-017**: Provider credentials MUST be encrypted before durable storage, scoped to their owner,
  excluded from application logs, and never returned in plaintext by any read response.
- **FR-018**: External model availability MUST be derived from the authenticated user's personal
  provider configuration, and generation MUST resolve credentials only after server-side ownership
  checks.
- **FR-019**: Credential replacement and removal MUST take effect for subsequent catalog reads and
  generation requests without deleting or rewriting prior messages.
- **FR-020**: The workspace header MUST derive external-provider readiness from the authenticated
  user's provider configuration. With no external provider configured it MUST show an actionable
  setup message and a button that opens provider settings; it MUST NOT show Connected.
- **FR-021**: Each connected provider group MUST expose multiple concrete server-controlled model
  entries with distinct provider model IDs, labels, and capability descriptions. A model override
  MAY become that provider's preferred entry but MUST NOT remove curated entries, create duplicates,
  or make an unconfigured provider available. Exactly one returned catalog entry MUST be the default.

### Key Entities

- **User**: Account owner with identity and session records.
- **Project**: Owner-scoped workspace grouping chats; has a name, optional description, and order.
- **Chat**: Conversation inside one project; has a title, selected provider/model defaults, and
  timestamps.
- **Message**: Ordered chat entry with role, content, status, and optional provider/model metadata.
- **Provider Catalog Entry**: Server-defined provider/model capability and availability metadata;
  it never contains or returns a client-supplied credential.
- **Provider Credential**: Owner-scoped, write-only provider secret with masked status metadata and
  lifecycle timestamps; exactly one current credential may exist per owner and provider.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A new user can register, create a project, open its initial chat, and reach personal
  provider settings from the no-model state in under three minutes without reading setup documentation.
- **SC-002**: Project, chat, and message changes remain correct after page refresh in all automated
  critical-path scenarios.
- **SC-003**: Unauthorized and cross-owner access attempts return no private project, chat, or
  message data in 100% of authorization tests.
- **SC-004**: The workspace has no serious automated accessibility violations in the primary
  desktop and mobile chat flows.
- **SC-005**: Primary workspace content becomes interactive within two seconds on a typical local
  development machine after the database is ready.
- **SC-006**: Every configured model can complete the same chat contract without provider-specific
  changes to project, chat, or message behavior.
- **SC-007**: All repository-defined migration, test, typecheck, lint, build, and browser gates pass,
  except live external-provider checks explicitly classified as unavailable without credentials.
- **SC-008**: A signed-in user can configure or remove a supported provider in under one minute, and
  the model selector reflects the new availability on the next view without signing out.
- **SC-009**: Authorization tests demonstrate that credential status and use remain isolated between
  users in 100% of cross-owner scenarios, while no test response contains a submitted secret.
- **SC-010**: Browser and catalog tests demonstrate that a connected provider exposes at least three
  concrete selectable models and that the catalog still returns exactly one default selection.

## Assumptions

- Version one is single-user ownership rather than project collaboration.
- Email and password is the initial authentication method; social login is out of scope.
- File uploads, tool execution approvals, runs, billing, and team roles are visual extension points
  but not functional scope for the first release.
- Chat titles may default from the first prompt but remain user-editable.
- Live provider calls are not required for local acceptance when credentials are unavailable.
- One current credential per user and external provider is sufficient for the first release.
- Saving a credential confirms secure storage and availability; it does not perform a paid provider
  request or guarantee that the external account is valid.
- English is the initial interface language.

## Out of Scope

- Production deployment, billing, subscriptions, team collaboration, shared projects, file storage,
  voice, image generation, autonomous tool execution, and importing external chat history.
- Shared organization credentials, provider account creation, automated key rotation, usage billing,
  and provider-side credential validation calls.
