import { NextRequest, NextResponse } from "next/server";
import { askClaude, AI_AVAILABLE } from "@/lib/claude";
import { findCandidateById, updateAiSummary, formatProfileForAI } from "@/lib/candidates";
import { PROMPTS } from "@/lib/prompts";
import { AI_TOKEN_LIMITS } from "@/lib/constants";
import { notFound, errorResponse, parseBody, candidateIdSchema } from "@/lib/api";
import { fallbackSummary } from "@/lib/ai-fallback";

export async function POST(req: NextRequest) {
  try {
    const parsed = await parseBody(req, candidateIdSchema);
    if ("error" in parsed) return parsed.error;

    const candidate = await findCandidateById(parsed.data.candidateId);
    if (!candidate) return notFound("Candidate");

    const summary = AI_AVAILABLE
      ? await askClaude(PROMPTS.SUMMARY, formatProfileForAI(candidate), AI_TOKEN_LIMITS.SUMMARY)
      : fallbackSummary(candidate);

    await updateAiSummary(candidate.id, summary);

    return NextResponse.json({ summary });
  } catch (err) {
    console.error("AI summary error:", err);
    return errorResponse("Failed to generate summary");
  }
}
