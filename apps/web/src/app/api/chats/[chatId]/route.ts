import { requireAvailableCatalogEntry } from "@beui-ai-studio/ai";
import { workspaceRepository } from "@beui-ai-studio/db";
import { z } from "zod";
import { apiError, validationError } from "@/lib/api";
import { listConfiguredProviderIds } from "@/lib/provider-credentials";
import { requireApiSession } from "@/lib/session";

const idSchema = z.string().uuid();
const updateChatSchema = z
  .object({
    title: z.string().trim().min(1).max(160).optional(),
    model: z.string().min(1).optional(),
  })
  .refine((value) => value.title !== undefined || value.model !== undefined, {
    message: "A title or model is required.",
  });

interface RouteContext {
  params: Promise<{ chatId: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireApiSession(request);
  if (!session) return apiError(401, "UNAUTHORIZED", "Authentication required.");

  const params = await context.params;
  const chatId = idSchema.safeParse(params.chatId);
  if (!chatId.success) return validationError(chatId.error);

  const body = updateChatSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return validationError(body.error);

  let modelEntry = null;
  if (body.data.model) {
    try {
      modelEntry = requireAvailableCatalogEntry(
        body.data.model,
        await listConfiguredProviderIds(session.user.id),
      );
    } catch (error) {
      return apiError(
        422,
        "MODEL_UNAVAILABLE",
        error instanceof Error ? error.message : "Invalid model selection.",
      );
    }
  }

  let chat = body.data.title
    ? await workspaceRepository.renameChat(
        session.user.id,
        chatId.data,
        body.data.title,
      )
    : await workspaceRepository.getChat(session.user.id, chatId.data);

  if (!chat) return apiError(404, "NOT_FOUND", "Chat not found.");

  if (modelEntry) {
    chat = await workspaceRepository.setChatModel(
      session.user.id,
      chatId.data,
      modelEntry.providerId,
      modelEntry.modelId,
    );
  }

  return Response.json({ chat });
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await requireApiSession(request);
  if (!session) return apiError(401, "UNAUTHORIZED", "Authentication required.");

  const params = await context.params;
  const chatId = idSchema.safeParse(params.chatId);
  if (!chatId.success) return validationError(chatId.error);

  const deleted = await workspaceRepository.deleteChat(session.user.id, chatId.data);
  if (!deleted) return apiError(404, "NOT_FOUND", "Chat not found.");
  return new Response(null, { status: 204 });
}
