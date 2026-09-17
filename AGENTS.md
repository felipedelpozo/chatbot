# AGENTS.md

## Scope

These instructions apply to the entire repository.

## Subagent models

- Every subagent MUST use either `gpt-5.6-luna` or a DeepSeek model.
- Prefer `gpt-5.6-luna` for implementation, integration, and test work.
- Prefer `deepseek/deepseek-v4-pro` for independent architecture or security review.
- Do not spawn subagents with any other model.

## Engineering rules

- Follow the active feature artifacts in `specs/` and the project constitution in
  `.specify/memory/constitution.md`.
- Use Bun for package management and scripts.
- Keep source code, identifiers, comments, and technical documentation in English.
- Preserve strict TypeScript and avoid `any`, `@ts-ignore`, and unsafe assertions.
- Add tests for new behavior and run focused checks before repository-wide validation.
- Never commit secrets. Local `.env*` files remain ignored; document variables in
  `.env.example` with non-secret placeholders.
- Do not commit, push, merge, deploy, or perform destructive data operations unless the
  user explicitly requests them.

