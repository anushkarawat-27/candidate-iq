import { NextRequest, NextResponse } from "next/server";
import { updateNotes, parseId } from "@/lib/candidates";
import { notFound, badRequest } from "@/lib/api";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseId(params.id);
  if (!id) return badRequest("Invalid candidate ID");

  const body = await req.json();
  if (typeof body.notes !== "string") return badRequest("Notes must be a string");

  const candidate = await updateNotes(id, body.notes);
  if (!candidate) return notFound("Candidate");

  return NextResponse.json(candidate);
}
