import { NextRequest, NextResponse } from "next/server";
import { askClaude, parseJsonResponse, AI_AVAILABLE } from "@/lib/claude";
import { findCandidateById, findCandidatesByIds, getAllCandidateSummaries, formatProfileForAI, formatProfileCompact } from "@/lib/candidates";
import { query } from "@/lib/db";
import { Candidate } from "@/lib/types";
import { PROMPTS } from "@/lib/prompts";
import { AI_TOKEN_LIMITS } from "@/lib/constants";
import { notFound, errorResponse, parseBody, candidateIdSchema } from "@/lib/api";
import { fallbackSimilar } from "@/lib/ai-fallback";

interface SimilarMatch { id: number; reason: string; }

export async function POST(req: NextRequest) {
  try {
    const parsed = await parseBody(req, candidateIdSchema);
    if ("error" in parsed) return parsed.error;

    const candidate = await findCandidateById(parsed.data.candidateId);
    if (!candidate) return notFound("Candidate");

    let matchData: SimilarMatch[];

    if (AI_AVAILABLE) {
      const others = await getAllCandidateSummaries();
      const othersList = others.filter((o) => o.id !== candidate.id).map(formatProfileCompact).join("\n");
      const sourceProfile = `Source candidate:\n${formatProfileForAI(candidate, { includeRepos: false })}`;
      const result = await askClaude(PROMPTS.SIMILAR, `${sourceProfile}\n\nAll other candidates:\n${othersList}`, AI_TOKEN_LIMITS.SIMILAR);
      const data = parseJsonResponse<{ matches: SimilarMatch[] }>(result);
      if (!data) return errorResponse("Failed to parse AI response");
      matchData = data.matches;
    } else {
      const allCandidates = await query<Candidate>('SELECT * FROM "Candidate"');
      matchData = fallbackSimilar(candidate, allCandidates);
    }

    const matchedCandidates = await findCandidatesByIds(matchData.map((m) => m.id));
    const matches = matchData
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
