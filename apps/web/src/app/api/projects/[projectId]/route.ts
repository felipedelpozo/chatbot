import { workspaceRepository } from "@beui-ai-studio/db";
import { z } from "zod";
import { apiError, validationError } from "@/lib/api";
import { requireApiSession } from "@/lib/session";

const idSchema = z.string().uuid();
const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

interface RouteContext {
  params: Promise<{ projectId: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireApiSession(request);
  if (!session) return apiError(401, "UNAUTHORIZED", "Authentication required.");

  const params = await context.params;
  const projectId = idSchema.safeParse(params.projectId);
  if (!projectId.success) return validationError(projectId.error);

  const body = updateProjectSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return validationError(body.error);

  const project = await workspaceRepository.renameProject(
    session.user.id,
    projectId.data,
    body.data.name,
  );
  if (!project) return apiError(404, "NOT_FOUND", "Project not found.");
  return Response.json({ project });
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await requireApiSession(request);
  if (!session) return apiError(401, "UNAUTHORIZED", "Authentication required.");

  const params = await context.params;
  const projectId = idSchema.safeParse(params.projectId);
  if (!projectId.success) return validationError(projectId.error);

  const deleted = await workspaceRepository.deleteProject(
    session.user.id,
    projectId.data,
  );
  if (!deleted) return apiError(404, "NOT_FOUND", "Project not found.");
  return new Response(null, { status: 204 });
}

