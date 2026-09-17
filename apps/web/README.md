# Web application

The Next.js application is the single deployable surface in this monorepo. It owns the App Router pages, Better Auth handler, owner-scoped JSON APIs, AI SDK streaming route, and the installed beUI Chat App registry source.

Run commands from the repository root. See the root `README.md` for environment setup, PostgreSQL startup, migration, development, and validation instructions.

Application-owned code lives in:

- `src/app/` for routes and server data loading
- `src/components/auth/` for account screens
- `src/components/workspace/` for project/chat integration
- `src/lib/` for server and message helpers

The files under `src/components/agents/` and `src/components/motion/` come from the official beUI registry and remain the visual/interaction baseline.
