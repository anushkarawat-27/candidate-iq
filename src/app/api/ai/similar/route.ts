import { NextRequest, NextResponse } from "next/server";
import { askClaude } from "@/lib/claude";
import { query, queryOne } from "@/lib/db";

const SYSTEM_PROMPT = `You are a candidate matching assistant. Given a source developer's profile and a list of other candidates, identify the top 5 most similar candidates.

Consider similarity across:
- Programming languages used
- Activity level (followers, stars, repo count)
- Seniority signals (account age, company)
- Technical focus area

Respond ONLY with valid JSON in this exact format, no explanation:
{
  "matches": [
    { "id": <candidate_id>, "reason": "one short sentence explaining the similarity" }
  ]
}

Return up to 5 matches, ordered by most similar first. Do NOT include the source candidate.`;

export async function POST(req: NextRequest) {
  try {
    const { candidateId } = await req.json();

    const candidate = await queryOne(
      'SELECT * FROM "Candidate" WHERE "id" = $1',
      [candidateId]
    );

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const c = candidate as Record<string, unknown>;

    // Get all other candidates (summary data only)
    const others = await query(
      `SELECT "id", "login", "name", "company", "location", "languages", "followers", "totalStars", "publicRepos", "bio"
       FROM "Candidate" WHERE "id" != $1`,
      [candidateId]
    );

    const sourceProfile = `Source candidate:
Name: ${c.name || c.login}, Languages: ${JSON.stringify(c.languages)}, Followers: ${c.followers}, Stars: ${c.totalStars}, Repos: ${c.publicRepos}, Company: ${c.company || "N/A"}, Bio: ${c.bio || "N/A"}`;

    const othersList = (others as Array<Record<string, unknown>>)
      .map(
        (o) =>
          `ID:${o.id} ${o.name || o.login} | langs:${JSON.stringify(o.languages)} | followers:${o.followers} | stars:${o.totalStars} | repos:${o.publicRepos} | company:${o.company || ""} | bio:${o.bio || ""}`
      )
      .join("\n");

    const result = await askClaude(
      SYSTEM_PROMPT,
      `${sourceProfile}\n\nAll other candidates:\n${othersList}`,
      512
    );

    let parsed;
    try {
      parsed = JSON.parse(result);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // Fetch full candidate data for the matched IDs
    const matchIds = parsed.matches.map((m: { id: number }) => m.id);
    if (matchIds.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    const placeholders = matchIds.map((_: number, i: number) => `$${i + 1}`).join(",");
    const matchedCandidates = await query(
      `SELECT * FROM "Candidate" WHERE "id" IN (${placeholders})`,
      matchIds
    );

    // Preserve order and attach reasons
    const matches = matchIds.map((id: number) => {
      const candidate = (matchedCandidates as Array<Record<string, unknown>>).find(
        (c) => c.id === id
      );
      const reason = parsed.matches.find((m: { id: number }) => m.id === id)?.reason;
      return { ...candidate, similarityReason: reason };
    }).filter(Boolean);

    return NextResponse.json({ matches });
  } catch (err) {
    console.error("AI similar error:", err);
    return NextResponse.json({ error: "Failed to find similar candidates" }, { status: 500 });
  }
}
