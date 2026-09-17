import { workspaceRepository } from "@beui-ai-studio/db";
import { z } from "zod";
import { apiError, validationError } from "@/lib/api";
import { requireApiSession } from "@/lib/session";

const idSchema = z.string().uuid();
const createChatSchema = z.object({
  title: z.string().trim().min(1).max(160).default("New conversation"),
});

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const session = await requireApiSession(request);
  if (!session) return apiError(401, "UNAUTHORIZED", "Authentication required.");

  const params = await context.params;
  const projectId = idSchema.safeParse(params.projectId);
  if (!projectId.success) return validationError(projectId.error);

  const rawBody = await request.json().catch(() => ({}));
  const body = createChatSchema.safeParse(rawBody);
  if (!body.success) return validationError(body.error);

  const chat = await workspaceRepository.createChat(
    session.user.id,
    projectId.data,
    body.data.title,
  );
  if (!chat) return apiError(404, "NOT_FOUND", "Project not found.");
  return Response.json({ chat }, { status: 201 });
}

