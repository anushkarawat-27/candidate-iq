import { NextRequest, NextResponse } from "next/server";
import { updateNotes, parseId } from "@/lib/candidates";
import { notFound, badRequest, parseBody, notesSchema } from "@/lib/api";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseId(params.id);
  if (!id) return badRequest("Invalid candidate ID");

  const parsed = await parseBody(req, notesSchema);
  if ("error" in parsed) return parsed.error;

  const candidate = await updateNotes(id, parsed.data.notes);
  if (!candidate) return notFound("Candidate");

  return NextResponse.json(candidate);
}
