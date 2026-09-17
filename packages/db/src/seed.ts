import { workspaceRepository } from "./repositories";

const ownerId = process.argv[2];
if (!ownerId) {
  throw new Error("Usage: bun run db:seed <better-auth-user-id>");
}

const result = await workspaceRepository.createProject(ownerId, {
  name: "Release workspace",
  description: "A local project for validating the agent workspace.",
});

console.info(`Seeded project ${result.project.id} and chat ${result.chat.id}.`);
