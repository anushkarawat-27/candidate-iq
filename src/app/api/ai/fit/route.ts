import { NextRequest, NextResponse } from "next/server";
import { askClaude, parseJsonResponse } from "@/lib/claude";
import { findCandidatesByIds, formatProfileForAI, updateFitScore } from "@/lib/candidates";
import { PROMPTS } from "@/lib/prompts";
import { badRequest, errorResponse } from "@/lib/api";

interface FitResult {
  score: number;
  reason: string;
}

export async function POST(req: NextRequest) {
  try {
    const { roleDescription, candidateIds } = await req.json();

    if (!roleDescription || typeof roleDescription !== "string") {
      return badRequest("Role description is required");
    }
    if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
      return badRequest("Candidate IDs are required");
    }

    const candidates = await findCandidatesByIds(candidateIds);
    const results: Array<{ id: number; score: number; reason: string }> = [];

    for (const c of candidates) {
      try {
        const profile = formatProfileForAI(c, { includeRepos: true, repoLimit: 5 });
        const result = await askClaude(
          PROMPTS.FIT,
          `Role: ${roleDescription}\n\nCandidate:\n${profile}`,
          150
        );

        const parsed = parseJsonResponse<FitResult>(result);
        const score = parsed?.score ?? 0;
        const reason = parsed?.reason ?? "Unable to score";

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
