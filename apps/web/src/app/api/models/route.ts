import { getModelCatalog } from "@beui-ai-studio/ai";
import { apiError } from "@/lib/api";
import { listConfiguredProviderIds } from "@/lib/provider-credentials";
import { requireApiSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await requireApiSession(request);
  if (!session) return apiError(401, "UNAUTHORIZED", "Authentication required.");

  const configuredProviders = await listConfiguredProviderIds(session.user.id);
  return Response.json({ models: getModelCatalog(configuredProviders) });
}
