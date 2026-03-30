import { NextRequest, NextResponse } from "next/server";
import { askClaude } from "@/lib/claude";
import { findCandidatesByIds, formatProfileForAI } from "@/lib/candidates";
import { PROMPTS } from "@/lib/prompts";
import { badRequest, errorResponse } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const { candidateIds } = await req.json();

    if (!Array.isArray(candidateIds) || candidateIds.length < 2 || candidateIds.length > 4) {
      return badRequest("Select 2-4 candidates to compare");
    }

    const candidates = await findCandidatesByIds(candidateIds);

    const profiles = candidates
      .map((c) => formatProfileForAI(c, { includeRepos: true, repoLimit: 3 }))
      .join("\n\n---\n\n");

    const comparison = await askClaude(
      PROMPTS.COMPARE,
      `Compare these candidates:\n\n${profiles}`,
      600
    );

    return NextResponse.json({ comparison });
  } catch (err) {
    console.error("AI compare error:", err);
    return errorResponse("Failed to generate comparison");
  }
}
