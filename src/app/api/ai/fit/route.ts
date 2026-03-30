import { NextRequest, NextResponse } from "next/server";
import { askClaude } from "@/lib/claude";
import { query } from "@/lib/db";

const SYSTEM_PROMPT = `You are a recruiting assistant. Given a job role description and a developer candidate's GitHub profile, score how well they fit the role on a scale of 0-100 and explain why in one concise sentence.

Consider:
- Language/skill match
- Experience signals (repos, stars, account age)
- Activity level
- Company/industry background if relevant
- Location match if mentioned in the role

Respond ONLY with valid JSON:
{"score": <0-100>, "reason": "<one sentence explanation>"}`;

export async function POST(req: NextRequest) {
  try {
    const { roleDescription, candidateIds } = await req.json();

    if (!roleDescription || !candidateIds?.length) {
      return NextResponse.json({ error: "Role description and candidate IDs required" }, { status: 400 });
    }

    // Fetch candidates
    const placeholders = candidateIds.map((_: number, i: number) => `$${i + 1}`).join(",");
    const candidates = await query(
      `SELECT * FROM "Candidate" WHERE "id" IN (${placeholders})`,
      candidateIds
    );

    const results: Array<{ id: number; score: number; reason: string }> = [];

    for (const c of candidates as Array<Record<string, unknown>>) {
      try {
        const profile = `Name: ${c.name || c.login}, Bio: ${c.bio || "N/A"}, Company: ${c.company || "N/A"}, Location: ${c.location || "N/A"}, Languages: ${JSON.stringify(c.languages)}, Followers: ${c.followers}, Stars: ${c.totalStars}, Repos: ${c.publicRepos}, Top Repos: ${JSON.stringify((c.topRepos as Array<Record<string, unknown>>)?.slice(0, 5)?.map(r => ({ name: r.name, stars: r.stars, language: r.language })) || [])}`;

        const result = await askClaude(
          SYSTEM_PROMPT,
          `Role: ${roleDescription}\n\nCandidate:\n${profile}`,
          150
        );

        const parsed = JSON.parse(result);
        results.push({ id: c.id as number, score: parsed.score, reason: parsed.reason });

        // Cache in DB
        await query(
          'UPDATE "Candidate" SET "fitScore" = $1, "fitReason" = $2, "updatedAt" = NOW() WHERE "id" = $3',
          [parsed.score, parsed.reason, c.id]
        );
      } catch {
        results.push({ id: c.id as number, score: 0, reason: "Unable to score" });
      }
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error("Fit scoring error:", err);
    return NextResponse.json({ error: "Fit scoring failed" }, { status: 500 });
  }
}
