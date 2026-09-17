import { z } from "zod";

const serverEnvironmentSchema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  OPENAI_MODEL: z.string().min(1).optional(),
  ANTHROPIC_MODEL: z.string().min(1).optional(),
  GOOGLE_MODEL: z.string().min(1).optional(),
});

export function readServerEnvironment() {
  return serverEnvironmentSchema.parse(process.env);
}
