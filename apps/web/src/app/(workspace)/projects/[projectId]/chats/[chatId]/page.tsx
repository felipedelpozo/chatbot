import { getModelCatalog } from "@beui-ai-studio/ai";
import { workspaceRepository } from "@beui-ai-studio/db";
import { notFound } from "next/navigation";
import { ChatWorkspace } from "@/components/workspace/chat-workspace";
import { toUIMessage } from "@/lib/chat-messages";
import { listConfiguredProviderIds } from "@/lib/provider-credentials";
import { requireSession } from "@/lib/session";

export default async function ProjectChatPage({
  params,
}: {
  params: Promise<{ projectId: string; chatId: string }>;
}) {
  const { projectId, chatId } = await params;
  const returnTo = `/projects/${projectId}/chats/${chatId}`;
  const session = await requireSession(returnTo);
  const [chatRecord, projects, configuredProviders] = await Promise.all([
    workspaceRepository.getChat(session.user.id, chatId),
    workspaceRepository.listProjects(session.user.id),
    listConfiguredProviderIds(session.user.id),
  ]);

  if (!chatRecord || chatRecord.project.id !== projectId) notFound();

  return (
    <ChatWorkspace
      chat={{
        id: chatRecord.chat.id,
        title: chatRecord.chat.title,
        providerId: chatRecord.chat.providerId,
        modelId: chatRecord.chat.modelId,
        messages: chatRecord.messages.map(toUIMessage),
      }}
      projectName={chatRecord.project.name}
      projects={projects}
      models={getModelCatalog(configuredProviders)}
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }}
    />
  );
}
