import { apiError } from "@/lib/api";
import { listProviderConfigurations } from "@/lib/provider-credentials";
import { requireApiSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await requireApiSession(request);
  if (!session) return apiError(401, "UNAUTHORIZED", "Authentication required.");

  return Response.json({
    providers: await listProviderConfigurations(session.user.id),
  });
}
