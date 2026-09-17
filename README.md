# beUI AI Studio

A Bun monorepo for a project-oriented AI chat workspace. The web application reproduces the beUI Chat App composition and adds durable projects, nested chats, Better Auth sessions, PostgreSQL persistence, and a controlled Vercel AI SDK model catalog.

## Stack

- Bun workspaces
- Next.js 16 App Router and React 19
- Tailwind CSS 4 and the official `@beui/chat-app` registry source
- Vercel AI SDK 7 with OpenAI, Anthropic, and Google
- Better Auth with email/password sessions
- Drizzle ORM and PostgreSQL 18 in Docker Compose
- Bun test and Playwright
- GitHub Spec Kit artifacts under `specs/001-agent-chat-workspace/`

## Local setup

1. Install dependencies:

   ```bash
   bun install
   ```

2. Copy the documented environment template:

   ```bash
   cp .env.example .env.local
   ```

   Generate a stable local `BETTER_AUTH_SECRET` with at least 32 random characters. It protects sessions and derives a separate encryption key for personal provider credentials. Changing it makes previously stored credentials unreadable, so keep it stable for the lifetime of the database.

3. Start PostgreSQL and apply migrations:

   ```bash
   bun run infra:up
   bun run db:migrate
   ```

4. Start the application:

   ```bash
   bun run dev
   ```

   Open `http://localhost:3000`, create an account, then create a project.

## Provider configuration

Provider credentials belong to individual authenticated users. Open the account menu at the bottom
of the sidebar, then choose **Settings** to add, replace, or remove OpenAI, Anthropic, and Google
credentials. Values are encrypted before database storage, never returned after saving, and resolved
only on the server for that user's generation request.

The optional `OPENAI_MODEL`, `ANTHROPIC_MODEL`, and `GOOGLE_MODEL` environment variables prepend a
preferred model to that provider's server-controlled curated catalog and deduplicate exact matches;
they do not configure credentials or make a provider available. The selector shows multiple concrete
models only for providers configured by the signed-in user. Without a personal credential, the
composer remains disabled and links directly to provider settings. Saving a credential does not make
a paid validation call.

## Validation

Keep PostgreSQL running, then execute:

```bash
bun run db:check
bun run typecheck
bun run lint
bun run test
bun run build
bun run test:e2e
```

Live provider checks remain unavailable until a user explicitly configures a real credential and
separately authorizes a provider call. Automated tests use synthetic credential values only.

## Repository layout

```text
apps/web       Next.js routes and beUI workspace
packages/ai    connected-provider catalog, credential routing, and AI SDK adapters
packages/auth  Better Auth configuration and client
packages/db    Drizzle schema, repositories, migrations, and seed helper
specs/         Spec Kit feature artifacts and convergence evidence
tests/e2e      browser-level critical journeys
```

## Database lifecycle

- `bun run infra:up` starts PostgreSQL 18.
- `bun run db:migrate` applies committed migrations.
- `bun run db:seed -- <better-auth-user-id>` creates a local example project for an existing user.
- `bun run infra:down` stops containers without deleting data.
- `bun run infra:reset` deletes the local development volume; use it only when a clean database is intended.
