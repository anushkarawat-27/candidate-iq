import { NextRequest, NextResponse } from "next/server";
import { askClaude } from "@/lib/claude";
import { findCandidateById, updateAiSummary, formatProfileForAI } from "@/lib/candidates";
import { PROMPTS } from "@/lib/prompts";
import { notFound, errorResponse } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const { candidateId } = await req.json();
    const candidate = await findCandidateById(candidateId);

    if (!candidate) return notFound("Candidate");

    const profileData = formatProfileForAI(candidate, { includeRepos: true, repoLimit: 5 });
    const summary = await askClaude(PROMPTS.SUMMARY, profileData, 300);

    await updateAiSummary(candidate.id, summary);

    return NextResponse.json({ summary });
  } catch (err) {
    console.error("AI summary error:", err);
    return errorResponse("Failed to generate summary");
  }
}
