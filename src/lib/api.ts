import { NextResponse } from "next/server";
import { z, ZodSchema } from "zod";

// --- Consistent Response Envelope ---

export function success<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ data, ...(meta ? { meta } : {}) });
}

export function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status });
}

export function notFound(resource: string = "Resource") {
  return errorResponse(`${resource} not found`, 404);
}

export function badRequest(message: string) {
  return errorResponse(message, 400);
}

// --- Request Validation ---

export async function parseBody<T>(
  req: Request,
  schema: ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      const message = result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join(", ");
      return { error: badRequest(message) };
    }
    return { data: result.data };
  } catch {
    return { error: badRequest("Invalid JSON body") };
  }
}

// --- Shared Zod Schemas ---

export const candidateIdSchema = z.object({
  candidateId: z.number().int().positive(),
});

export const candidateIdsSchema = z.object({
  candidateIds: z.array(z.number().int().positive()).min(1).max(200),
});

export const compareSchema = z.object({
  candidateIds: z.array(z.number().int().positive()).min(2).max(4),
});

export const fitSchema = z.object({
  roleDescription: z.string().min(1, "Role description is required"),
  candidateIds: z.array(z.number().int().positive()).min(1).max(200),
});

export const searchSchema = z.object({
  query: z.string().min(1, "Query is required"),
});

export const notesSchema = z.object({
  notes: z.string(),
});
