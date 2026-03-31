import { NextRequest, NextResponse } from "next/server";
import { askClaude } from "@/lib/claude";
import { findCandidateById, updateAiSummary, formatProfileForAI } from "@/lib/candidates";
import { PROMPTS } from "@/lib/prompts";
import { AI_TOKEN_LIMITS } from "@/lib/constants";
import { notFound, errorResponse, parseBody, candidateIdSchema } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const parsed = await parseBody(req, candidateIdSchema);
    if ("error" in parsed) return parsed.error;

    const candidate = await findCandidateById(parsed.data.candidateId);
    if (!candidate) return notFound("Candidate");

    const summary = await askClaude(PROMPTS.SUMMARY, formatProfileForAI(candidate), AI_TOKEN_LIMITS.SUMMARY);
    await updateAiSummary(candidate.id, summary);

    return NextResponse.json({ summary });
  } catch (err) {
    console.error("AI summary error:", err);
    return errorResponse("Failed to generate summary");
  }
}
