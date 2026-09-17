import {
  getCatalogEntry,
  isExternalProviderId,
  requireAvailableCatalogEntry,
  resolveLanguageModel,
} from "@beui-ai-studio/ai";
import { workspaceRepository } from "@beui-ai-studio/db";
import {
  consumeStream,
  convertToModelMessages,
  createUIMessageStreamResponse,
  safeValidateUIMessages,
  streamText,
  toUIMessageStream,
  type UIMessage,
  type UIMessageStreamOnEndCallback,
} from "ai";
import { z } from "zod";
import { apiError, validationError } from "@/lib/api";
import { getMessageText } from "@/lib/chat-messages";
import { loadProviderCredential } from "@/lib/provider-credentials";
import { requireApiSession } from "@/lib/session";

export const maxDuration = 60;

const chatRequestSchema = z.object({
  chatId: z.string().uuid(),
  model: z.string().min(1),
  messages: z.unknown(),
});

export async function POST(request: Request) {
  const session = await requireApiSession(request);
  if (!session) return apiError(401, "UNAUTHORIZED", "Authentication required.");
  const ownerId = session.user.id;

  const parsed = chatRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);

  const validatedMessages = await safeValidateUIMessages<UIMessage>({
    messages: parsed.data.messages,
  });
  if (!validatedMessages.success) {
    return apiError(422, "INVALID_MESSAGES", "The message history is invalid.");
  }
  if (validatedMessages.data.length > 250) {
    return apiError(422, "TOO_MANY_MESSAGES", "The request exceeds 250 messages.");
  }

  const { chatId, model: catalogId } = parsed.data;
  const incomingMessages = validatedMessages.data;
  const chat = await workspaceRepository.getChat(ownerId, chatId);
  if (!chat) return apiError(404, "NOT_FOUND", "Chat not found.");

  let providerApiKey: string | null = null;
  const requestedEntry = getCatalogEntry(catalogId);
  if (!requestedEntry) {
    return apiError(422, "MODEL_UNAVAILABLE", "Unknown model selection.");
  }

  if (!isExternalProviderId(requestedEntry.providerId)) {
    return apiError(422, "MODEL_UNAVAILABLE", "Unknown model selection.");
  }

  try {
    providerApiKey = await loadProviderCredential(
      ownerId,
      requestedEntry.providerId,
    );
  } catch {
    return apiError(
      503,
      "PROVIDER_CREDENTIAL_ERROR",
      "The provider credential could not be read. Replace it in settings and try again.",
    );
  }
  if (!providerApiKey) {
    return apiError(
      422,
      "MODEL_UNAVAILABLE",
      "The selected model is not configured.",
    );
  }
  const entry = requireAvailableCatalogEntry(catalogId, [requestedEntry.providerId]);

  const lastMessage = incomingMessages.at(-1);
  const prompt = lastMessage ? getMessageText(lastMessage).trim() : "";
  if (!lastMessage || lastMessage.role !== "user" || !prompt) {
    return apiError(422, "INVALID_PROMPT", "The last message must contain user text.");
  }
  if (prompt.length > 32_000) {
    return apiError(422, "PROMPT_TOO_LONG", "The prompt exceeds 32,000 characters.");
  }

  const savedUserMessage = await workspaceRepository.appendMessage({
    chatId,
    ownerId,
    role: "user",
    content: prompt,
  });
  if (!savedUserMessage) return apiError(404, "NOT_FOUND", "Chat not found.");

  await workspaceRepository.setChatModel(
    ownerId,
    chatId,
    entry.providerId,
    entry.modelId,
  );

  async function saveAssistant(content: string) {
    await workspaceRepository.appendMessage({
      chatId,
      ownerId,
      role: "assistant",
      content,
      providerId: entry.providerId,
      modelId: entry.modelId,
    });
  }

  const persistAssistant: UIMessageStreamOnEndCallback<UIMessage> = async ({
    responseMessage,
    outcome,
    isAborted,
  }) => {
    if (isAborted || outcome.status !== "completed") return;
    const content = getMessageText(responseMessage).trim();
    if (!content) return;
    await saveAssistant(content);
  };

  const originalMessages = incomingMessages.map((message, index) =>
    index === incomingMessages.length - 1
      ? { ...message, id: savedUserMessage.id }
      : message,
  );

  try {
    if (!providerApiKey) throw new Error("The provider credential is unavailable.");
    const { model } = resolveLanguageModel(entry, providerApiKey);
    const result = streamText({
      model,
      messages: await convertToModelMessages(originalMessages),
      abortSignal: request.signal,
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({
        stream: result.stream,
        originalMessages,
        onEnd: persistAssistant,
        onError: () => "The provider could not complete this response.",
      }),
      consumeSseStream: ({ stream }) => consumeStream({ stream }),
    });
  } catch {
    return apiError(
      503,
      "PROVIDER_ERROR",
      "The provider could not start this response. Try again.",
    );
  }
}
