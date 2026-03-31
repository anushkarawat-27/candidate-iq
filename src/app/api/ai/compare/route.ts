import { NextRequest, NextResponse } from "next/server";
import { askClaude, AI_AVAILABLE } from "@/lib/claude";
import { findCandidatesByIds, formatProfileForAI } from "@/lib/candidates";
import { PROMPTS } from "@/lib/prompts";
import { AI_TOKEN_LIMITS } from "@/lib/constants";
import { errorResponse, parseBody, compareSchema } from "@/lib/api";
import { fallbackCompare } from "@/lib/ai-fallback";

export async function POST(req: NextRequest) {
  try {
    const parsed = await parseBody(req, compareSchema);
    if ("error" in parsed) return parsed.error;

    const candidates = await findCandidatesByIds(parsed.data.candidateIds);

    const comparison = AI_AVAILABLE
      ? await askClaude(
          PROMPTS.COMPARE,
          `Compare these candidates:\n\n${candidates.map((c) => formatProfileForAI(c, { includeRepos: true, repoLimit: 3 })).join("\n\n---\n\n")}`,
          AI_TOKEN_LIMITS.COMPARE
        )
      : fallbackCompare(candidates);

    return NextResponse.json({ comparison });
  } catch (err) {
    console.error("AI compare error:", err);
    return errorResponse("Failed to generate comparison");
  }
}
