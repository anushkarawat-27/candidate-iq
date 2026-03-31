import { NextRequest, NextResponse } from "next/server";
import { askClaude, parseJsonResponse } from "@/lib/claude";
import { findCandidateById, findCandidatesByIds, getAllCandidateSummaries, formatProfileForAI, formatProfileCompact } from "@/lib/candidates";
import { PROMPTS } from "@/lib/prompts";
import { AI_TOKEN_LIMITS } from "@/lib/constants";
import { notFound, errorResponse, parseBody, candidateIdSchema } from "@/lib/api";

interface SimilarMatch { id: number; reason: string; }

export async function POST(req: NextRequest) {
  try {
    const parsed = await parseBody(req, candidateIdSchema);
    if ("error" in parsed) return parsed.error;

    const candidate = await findCandidateById(parsed.data.candidateId);
    if (!candidate) return notFound("Candidate");

    const others = await getAllCandidateSummaries();
    const othersList = others.filter((o) => o.id !== candidate.id).map(formatProfileCompact).join("\n");
    const sourceProfile = `Source candidate:\n${formatProfileForAI(candidate, { includeRepos: false })}`;

    const result = await askClaude(PROMPTS.SIMILAR, `${sourceProfile}\n\nAll other candidates:\n${othersList}`, AI_TOKEN_LIMITS.SIMILAR);
    const data = parseJsonResponse<{ matches: SimilarMatch[] }>(result);
    if (!data) return errorResponse("Failed to parse AI response");

    const matchedCandidates = await findCandidatesByIds(data.matches.map((m) => m.id));
    const matches = data.matches
      .map((m) => {
        const c = matchedCandidates.find((c) => c.id === m.id);
        return c ? { ...c, similarityReason: m.reason } : null;
      })
      .filter(Boolean);

    return NextResponse.json({ matches });
  } catch (err) {
    console.error("AI similar error:", err);
    return errorResponse("Failed to find similar candidates");
  }
}
