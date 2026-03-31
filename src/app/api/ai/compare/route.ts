import { NextRequest, NextResponse } from "next/server";
import { askClaude } from "@/lib/claude";
import { findCandidatesByIds, formatProfileForAI } from "@/lib/candidates";
import { PROMPTS } from "@/lib/prompts";
import { AI_TOKEN_LIMITS } from "@/lib/constants";
import { errorResponse, parseBody, compareSchema } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const parsed = await parseBody(req, compareSchema);
    if ("error" in parsed) return parsed.error;

    const candidates = await findCandidatesByIds(parsed.data.candidateIds);
    const profiles = candidates.map((c) => formatProfileForAI(c, { includeRepos: true, repoLimit: 3 })).join("\n\n---\n\n");
    const comparison = await askClaude(PROMPTS.COMPARE, `Compare these candidates:\n\n${profiles}`, AI_TOKEN_LIMITS.COMPARE);

    return NextResponse.json({ comparison });
  } catch (err) {
    console.error("AI compare error:", err);
    return errorResponse("Failed to generate comparison");
  }
}
