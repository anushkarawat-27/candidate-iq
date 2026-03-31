import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  GITHUB_TOKEN: z.string().min(1).optional(),
});

function validateEnv() {
  // Skip validation during build time (env vars aren't available)
  if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
    return { DATABASE_URL: "", ANTHROPIC_API_KEY: undefined, GITHUB_TOKEN: undefined };
  }

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error("Environment validation failed:");
    result.error.issues.forEach((issue) => {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    });
    throw new Error("Missing or invalid environment variables");
  }
  return result.data;
}

export const env = validateEnv();
