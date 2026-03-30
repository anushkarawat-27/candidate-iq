import { NextRequest, NextResponse } from "next/server";
import { askClaude, parseJsonResponse } from "@/lib/claude";
import { findCandidateById, findCandidatesByIds, getAllCandidateSummaries, formatProfileForAI, formatProfileCompact } from "@/lib/candidates";
import { PROMPTS } from "@/lib/prompts";
import { notFound, errorResponse } from "@/lib/api";

interface SimilarMatch {
  id: number;
  reason: string;
}

export async function POST(req: NextRequest) {
  try {
    const { candidateId } = await req.json();
    const candidate = await findCandidateById(candidateId);

    if (!candidate) return notFound("Candidate");

    const others = await getAllCandidateSummaries();
    const othersList = others
      .filter((o) => o.id !== candidateId)
      .map(formatProfileCompact)
      .join("\n");

    const sourceProfile = `Source candidate:\n${formatProfileForAI(candidate, { includeRepos: false })}`;

    const result = await askClaude(
      PROMPTS.SIMILAR,
      `${sourceProfile}\n\nAll other candidates:\n${othersList}`,
      512
    );

    const parsed = parseJsonResponse<{ matches: SimilarMatch[] }>(result);
    if (!parsed) return errorResponse("Failed to parse AI response");

    const matchIds = parsed.matches.map((m) => m.id);
    const matchedCandidates = await findCandidatesByIds(matchIds);

    const matches = matchIds
      .map((id) => {
        const c = matchedCandidates.find((c) => c.id === id);
        const reason = parsed.matches.find((m) => m.id === id)?.reason;
        return c ? { ...c, similarityReason: reason } : null;
      })
      .filter(Boolean);

    return NextResponse.json({ matches });
  } catch (err) {
    console.error("AI similar error:", err);
    return errorResponse("Failed to find similar candidates");
  }
}
