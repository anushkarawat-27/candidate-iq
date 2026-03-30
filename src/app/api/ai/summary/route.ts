import { NextRequest, NextResponse } from "next/server";
import { askClaude } from "@/lib/claude";
import { query, queryOne } from "@/lib/db";

const SYSTEM_PROMPT = `You are a recruiter's assistant. Given a developer's GitHub profile data, write a concise 2-3 sentence summary that a recruiter would find useful.

Focus on:
- What kind of developer they are (frontend, backend, systems, full-stack, etc.)
- Their primary languages and technical focus areas
- Notable signals (high star count, active maintainer, works at a notable company, etc.)
- Any hiring-relevant info (location, hireable status)

Write in a professional but natural tone. Do NOT use bullet points. Do NOT start with the person's name. Just describe them directly.`;

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

    // Build profile description for Claude
    const profileData = `
Name: ${c.name || c.login}
Username: ${c.login}
Bio: ${c.bio || "N/A"}
Company: ${c.company || "N/A"}
Location: ${c.location || "N/A"}
Hireable: ${c.hireable ? "Yes" : "No"}
Followers: ${c.followers}
Following: ${c.following}
Public Repos: ${c.publicRepos}
Total Stars: ${c.totalStars}
Languages: ${JSON.stringify(c.languages) || "None"}
Top Repos: ${JSON.stringify((c.topRepos as Array<Record<string, unknown>>)?.slice(0, 5)?.map((r) => ({
      name: r.name,
      stars: r.stars,
      language: r.language,
      description: r.description,
    })) || [])}
Account Created: ${c.createdAtGh}
    `.trim();

    const summary = await askClaude(SYSTEM_PROMPT, profileData, 300);

    // Cache the summary in the database
    await query(
      'UPDATE "Candidate" SET "aiSummary" = $1, "updatedAt" = NOW() WHERE "id" = $2',
      [summary, candidateId]
    );

    return NextResponse.json({ summary });
  } catch (err) {
    console.error("AI summary error:", err);
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
  }
}
