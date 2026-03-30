import { NextRequest, NextResponse } from "next/server";
import { queryOne } from "@/lib/db";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const candidate = await queryOne(
    `UPDATE "Candidate" SET "shortlisted" = NOT "shortlisted", "updatedAt" = NOW()
     WHERE "id" = $1 RETURNING *`,
    [parseInt(params.id)]
  );

  if (!candidate) {
    return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
  }

  return NextResponse.json(candidate);
}
