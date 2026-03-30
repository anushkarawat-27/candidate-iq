import { NextRequest, NextResponse } from "next/server";
import { askClaude } from "@/lib/claude";
import { query } from "@/lib/db";

const SYSTEM_PROMPT = `You are a recruiter's assistant. Given 2-4 developer candidate profiles, write a comparison brief that helps a recruiter decide who to reach out to.

Structure your response as:
1. A brief overview comparing the candidates (2-3 sentences)
2. For each candidate, one sentence on their key strength
3. A final recommendation sentence on which candidate(s) stand out and why

Write in a professional, concise tone. Use the candidates' names. Keep the total response under 200 words.`;

export async function POST(req: NextRequest) {
  try {
    const { candidateIds } = await req.json();

    if (!Array.isArray(candidateIds) || candidateIds.length < 2 || candidateIds.length > 4) {
      return NextResponse.json(
        { error: "Select 2-4 candidates to compare" },
        { status: 400 }
      );
    }

    const placeholders = candidateIds.map((_: number, i: number) => `$${i + 1}`).join(",");
    const candidates = await query(
      `SELECT * FROM "Candidate" WHERE "id" IN (${placeholders})`,
      candidateIds
    );

    const profiles = (candidates as Array<Record<string, unknown>>)
      .map(
        (c) => `
Name: ${c.name || c.login}
Username: ${c.login}
Bio: ${c.bio || "N/A"}
Company: ${c.company || "N/A"}
Location: ${c.location || "N/A"}
Followers: ${c.followers}
Total Stars: ${c.totalStars}
Public Repos: ${c.publicRepos}
Languages: ${JSON.stringify(c.languages)}
Top Repos: ${JSON.stringify((c.topRepos as Array<Record<string, unknown>>)?.slice(0, 3)?.map((r) => ({ name: r.name, stars: r.stars, language: r.language })) || [])}
      `.trim()
      )
      .join("\n\n---\n\n");

    const comparison = await askClaude(
      SYSTEM_PROMPT,
      `Compare these candidates:\n\n${profiles}`,
      600
    );

    return NextResponse.json({ comparison });
  } catch (err) {
    console.error("AI compare error:", err);
    return NextResponse.json({ error: "Failed to generate comparison" }, { status: 500 });
  }
}
