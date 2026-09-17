<!--
Sync Impact Report
- Version change: 1.0.0 -> 1.1.0
- Modified constraints: local deterministic demo provider replaced by an explicit provider-setup
  state that exposes only models backed by the authenticated user's configured credentials
- Added principles: Spec-driven traceability; Working vertical slices; Secure identity and data;
  Provider portability; Interface fidelity and accessibility; Evidence before completion
- Added sections: Product constraints; Development workflow
- Templates reviewed: plan-template.md, spec-template.md, tasks-template.md
- Follow-up TODOs: none
-->
# beUI AI Studio Constitution

## Core Principles

### I. Spec-Driven Traceability
Every product change MUST start from an active Spec Kit feature. Functional requirements,
acceptance scenarios, architecture decisions, tasks, implementation, and validation evidence
MUST remain traceable. Product requirements MUST NOT be silently narrowed during implementation.

### II. Working Vertical Slices
Each prioritized user story MUST produce independently testable user value across interface,
application logic, persistence, authorization, and failure handling. Placeholder-only paths or
mock-only demonstrations MUST NOT be presented as finished behavior.

### III. Secure Identity and Data
Better Auth is the identity and session authority. Project and chat data MUST be scoped to the
authenticated owner on the server, untrusted input MUST be validated at boundaries, foreign keys
MUST be indexed, and secrets MUST remain outside version control. Destructive schema changes
require an explicit migration and rollback strategy.

### IV. Provider Portability
AI features MUST depend on an application-owned provider/model catalog rather than provider-
specific UI or business logic. Provider credentials MUST be resolved server-side. A missing or
failed provider MUST produce a clear recoverable state without corrupting persisted conversation
history.

### V. Interface Fidelity and Accessibility
The workspace MUST preserve the referenced beUI Chat App composition, hierarchy, responsive
behavior, and interaction language. Keyboard operation, visible focus, semantic labels, reduced
motion, loading states, empty states, and error states are mandatory. Visual changes require
desktop and mobile browser evidence.

### VI. Evidence Before Completion
No behavior is complete without proportionate evidence. Required gates are migration validation,
type checking, linting, automated tests, production build, and browser verification of critical
flows. Unavailable external credentials or services MUST be reported as unavailable, never passed.

## Product Constraints

- The repository is a Bun workspace monorepo with a Next.js App Router web application.
- PostgreSQL and Drizzle ORM own durable application and Better Auth data.
- The Vercel AI SDK owns model streaming and provider integration boundaries.
- The first release supports projects containing ordered chats and messages.
- Without a configured provider, the application MUST remain navigable and MUST provide a direct,
  recoverable provider-setup path, but it MUST NOT expose a demo model or imply generation is ready.
- The model selector MUST expose only models backed by the authenticated user's configured personal
  provider credentials.
- Source code and technical documentation use English; user-facing copy may be localized later.

## Development Workflow

Work follows `specify -> clarify -> plan -> tasks -> analyze -> implement -> converge`. Tests are
written alongside behavior and regression-sensitive fixes. Shared contracts, migrations, and root
configuration are integrated sequentially. Parallel agents require disjoint file ownership and MUST
use `gpt-5.6-luna` or a DeepSeek model as defined in `AGENTS.md`. The final review checks the full
diff for accidental files and secrets.

## Governance

This constitution supersedes conflicting local conventions. Amendments require a documented
reason, a semantic version change, and propagation to dependent templates or active feature
artifacts. Every implementation review MUST verify constitution compliance. Complexity that
exceeds the active plan requires an explicit justification in the plan's Complexity Tracking table.

**Version**: 1.1.0 | **Ratified**: 2026-09-17 | **Last Amended**: 2026-09-17
