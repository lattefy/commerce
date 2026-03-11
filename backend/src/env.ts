import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),

  DATABASE_URL: z.string().min(1),

  FRONTEND_URL: z.string().url().optional(),

  SUPABASE_URL: z.string().url(),
  SUPABASE_JWKS_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  MP_CLIENT_ID: z.string().min(1),
  MP_CLIENT_SECRET: z.string().min(1),
  MP_REDIRECT_URI: z.string().url(),
  MP_ACCESS_TOKEN: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);

  if (!parsed.success) {
    throw new Error(`Invalid environment variables:\n${parsed.error.message}`);
  }

  return parsed.data;
}