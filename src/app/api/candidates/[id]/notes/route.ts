import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { notes } = await req.json();
  const candidate = await queryOne(
    `UPDATE "Candidate" SET "notes" = $1, "updatedAt" = NOW()
     WHERE "id" = $2 RETURNING *`,
    [notes, parseInt(params.id)]
  );

  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  return NextResponse.json(candidate);
}
