import { NextRequest, NextResponse } from "next/server";
import { toggleShortlist, parseId } from "@/lib/candidates";
import { notFound, badRequest } from "@/lib/api";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseId(params.id);
  if (!id) return badRequest("Invalid candidate ID");

  const candidate = await toggleShortlist(id);
  if (!candidate) return notFound("Candidate");

  return NextResponse.json(candidate);
}
