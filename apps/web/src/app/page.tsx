import { workspaceRepository } from "@beui-ai-studio/db";
import { redirect } from "next/navigation";
import { WorkspaceEmpty } from "@/components/workspace/workspace-empty";
import { requireSession } from "@/lib/session";

export default async function Home() {
  const session = await requireSession("/");
  const projects = await workspaceRepository.listProjects(session.user.id);
  const firstDestination = projects
    .flatMap((project) =>
      project.chats.map((chat) => ({ projectId: project.id, chatId: chat.id })),
    )
    .at(0);

  if (firstDestination) {
    redirect(
      `/projects/${firstDestination.projectId}/chats/${firstDestination.chatId}`,
    );
  }

  return (
    <WorkspaceEmpty
      projects={projects}
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }}
    />
  );
}
