# Quickstart: Multi-Provider Agent Chat Workspace

## Prerequisites

- Bun 1.3.14 or newer compatible release
- Docker with Compose
- An available local port 3000 for the web app and 54329 for PostgreSQL

The workspace can be explored without a credential, but generation remains disabled until the
signed-in user configures an external provider in Settings.

## Start the local stack

```bash
bun install
bun run infra:up
bun run db:migrate
bun run dev
```

Open `http://127.0.0.1:3000`, create an account, and enter the workspace.

## Validate the primary journey

1. Create an account with email and password.
2. Create a project named `Release workspace`.
3. Open its initial chat and confirm the selector shows no Demo or unconfigured provider model.
4. Use the header setup action to open provider settings.
5. Configure a provider and confirm only that provider's group appears with multiple concrete models.
6. Create and rename a second chat; confirm the sidebar matches the project hierarchy.
7. Sign out and confirm private routes redirect to sign-in.

## Validate personal provider settings

1. Open the account menu at the bottom of the workspace sidebar, then select `Settings`.
2. Save a non-production test-shaped value for OpenAI without sending a chat prompt.
3. Confirm the panel shows only a masked suffix and the curated OpenAI models become selectable.
4. Sign in as a second account and confirm OpenAI remains unconfigured for that user.
5. Return to the first account, replace the value, then remove it and confirm its model disappears
   while existing messages remain.

Automated tests use synthetic values only and never submit them to an external provider.

## Quality gates

```bash
bun run db:generate
bun run db:check
bun run typecheck
bun run lint
bun run test
bun run build
bun run test:e2e
```

Live provider smoke tests require a real credential entered by the authenticated user through the
settings panel. Without an explicit credential and separate authorization for a live call, classify
them as unavailable; do not substitute a demo model.

## Stop local infrastructure

```bash
bun run infra:down
```
