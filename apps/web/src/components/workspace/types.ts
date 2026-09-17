import type { ModelCatalogEntry } from "@beui-ai-studio/ai";
import type { UIMessage } from "ai";

export interface WorkspaceChatSummary {
  id: string;
  projectId: string;
  title: string;
  providerId: string | null;
  modelId: string | null;
}

export interface WorkspaceProjectSummary {
  id: string;
  name: string;
  description: string | null;
  chats: WorkspaceChatSummary[];
}

export interface WorkspaceUser {
  name: string;
  email: string;
  image?: string | null;
}

export interface WorkspaceChatData {
  id: string;
  title: string;
  providerId: string | null;
  modelId: string | null;
  messages: UIMessage[];
}

export type { ModelCatalogEntry };
