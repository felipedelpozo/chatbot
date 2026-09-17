import { externalProviderIds } from "@beui-ai-studio/ai";
import { z } from "zod";
import { apiError, validationError } from "@/lib/api";
import {
  listProviderConfigurations,
  removeProviderCredential,
  saveProviderCredential,
} from "@/lib/provider-credentials";
import { requireApiSession } from "@/lib/session";

const providerIdSchema = z.enum(externalProviderIds);
const credentialSchema = z.object({
  apiKey: z.string().trim().min(12).max(4096),
});

interface RouteContext {
  params: Promise<{ providerId: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await requireApiSession(request);
  if (!session) return apiError(401, "UNAUTHORIZED", "Authentication required.");

  const providerId = providerIdSchema.safeParse((await context.params).providerId);
  if (!providerId.success) return validationError(providerId.error);

  const body = credentialSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return validationError(body.error);

  await saveProviderCredential(session.user.id, providerId.data, body.data.apiKey);
  const providers = await listProviderConfigurations(session.user.id);
  const provider = providers.find((candidate) => candidate.providerId === providerId.data);
  if (!provider) return apiError(500, "PROVIDER_STATUS_ERROR", "Provider status unavailable.");

  return Response.json({ provider });
}

export async function DELETE(request: Request, context: RouteContext) {
  const session = await requireApiSession(request);
  if (!session) return apiError(401, "UNAUTHORIZED", "Authentication required.");

  const providerId = providerIdSchema.safeParse((await context.params).providerId);
  if (!providerId.success) return validationError(providerId.error);

  await removeProviderCredential(session.user.id, providerId.data);
  return new Response(null, { status: 204 });
}
