import { NextRequest, NextResponse } from "next/server";
import { askClaude, parseJsonResponse } from "@/lib/claude";
import { findCandidatesByIds, formatProfileForAI, updateFitScore } from "@/lib/candidates";
import { PROMPTS } from "@/lib/prompts";
import { AI_TOKEN_LIMITS } from "@/lib/constants";
import { errorResponse, parseBody, fitSchema } from "@/lib/api";

interface FitResult { score: number; reason: string; }

export async function POST(req: NextRequest) {
  try {
    const parsed = await parseBody(req, fitSchema);
    if ("error" in parsed) return parsed.error;

    const { roleDescription, candidateIds } = parsed.data;
    const candidates = await findCandidatesByIds(candidateIds);
    const results: Array<{ id: number; score: number; reason: string }> = [];

    for (const c of candidates) {
      try {
        const profile = formatProfileForAI(c, { includeRepos: true, repoLimit: 5 });
        const result = await askClaude(PROMPTS.FIT, `Role: ${roleDescription}\n\nCandidate:\n${profile}`, AI_TOKEN_LIMITS.FIT);
        const fit = parseJsonResponse<FitResult>(result);
        const score = fit?.score ?? 0;
        const reason = fit?.reason ?? "Unable to score";
        results.push({ id: c.id, score, reason });
        await updateFitScore(c.id, score, reason);
      } catch {
        results.push({ id: c.id, score: 0, reason: "Unable to score" });
      }
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Fit scoring error:", err);
    return errorResponse("Fit scoring failed");
  }
}
