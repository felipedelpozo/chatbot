import { workspaceRepository } from "@beui-ai-studio/db";
import { z } from "zod";
import { apiError, validationError } from "@/lib/api";
import { requireApiSession } from "@/lib/session";

const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).optional(),
});

export async function POST(request: Request) {
  const session = await requireApiSession(request);
  if (!session) return apiError(401, "UNAUTHORIZED", "Authentication required.");

  const result = createProjectSchema.safeParse(await request.json().catch(() => null));
  if (!result.success) return validationError(result.error);

  const created = await workspaceRepository.createProject(
    session.user.id,
    result.data,
  );
  return Response.json(created, { status: 201 });
}

