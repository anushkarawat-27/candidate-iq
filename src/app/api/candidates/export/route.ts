import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { askClaude } from "@/lib/claude";

function escapeCsv(value: unknown): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const SUMMARY_PROMPT = `You are a recruiter's assistant. Given a developer's GitHub profile data, write a concise 2-3 sentence summary that a recruiter would find useful. Focus on what kind of developer they are, their primary languages, notable signals, and hiring-relevant info. Write in a professional but natural tone. Do NOT use bullet points. Do NOT start with the person's name.`;

async function generateSummary(c: Record<string, unknown>): Promise<string> {
  const profileData = `Name: ${c.name || c.login}, Username: ${c.login}, Bio: ${c.bio || "N/A"}, Company: ${c.company || "N/A"}, Location: ${c.location || "N/A"}, Followers: ${c.followers}, Total Stars: ${c.totalStars}, Public Repos: ${c.publicRepos}, Languages: ${JSON.stringify(c.languages) || "None"}, Top Repos: ${JSON.stringify((c.topRepos as Array<Record<string, unknown>>)?.slice(0, 5)?.map((r) => ({ name: r.name, stars: r.stars, language: r.language })) || [])}`;
  return askClaude(SUMMARY_PROMPT, profileData, 300);
}

export async function GET() {
  const candidates = await query(
    `SELECT * FROM "Candidate" WHERE "shortlisted" = true ORDER BY "followers" DESC`
  );

  if (candidates.length === 0) {
    return NextResponse.json(
      { error: "No shortlisted candidates to export" },
      { status: 400 }
    );
  }

  // Generate AI summaries for any candidates missing one
  const typedCandidates = candidates as Array<Record<string, unknown>>;
  for (const c of typedCandidates) {
    if (!c.aiSummary) {
      try {
        const summary = await generateSummary(c);
        c.aiSummary = summary;
        await query(
          'UPDATE "Candidate" SET "aiSummary" = $1, "updatedAt" = NOW() WHERE "id" = $2',
          [summary, c.id]
        );
      } catch {
        c.aiSummary = "";
      }
    }
  }

  const headers = [
    "Name",
    "Username",
    "GitHub URL",
    "Email",
    "Location",
    "Company",
    "Bio",
    "Languages",
    "Followers",
    "Total Stars",
    "Public Repos",
    "Blog",
    "Twitter",
    "AI Summary",
  ];

  const rows = typedCandidates.map((c) => [
    escapeCsv(c.name || c.login),
    escapeCsv(c.login),
    escapeCsv(c.profileUrl),
    escapeCsv(c.email),
    escapeCsv(c.location),
    escapeCsv(c.company),
    escapeCsv(c.bio),
    escapeCsv(Array.isArray(c.languages) ? c.languages.join(", ") : ""),
    escapeCsv(c.followers),
    escapeCsv(c.totalStars),
    escapeCsv(c.publicRepos),
    escapeCsv(c.blog),
    escapeCsv(c.twitterUsername ? `@${c.twitterUsername}` : ""),
    escapeCsv(c.aiSummary),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="shortlisted-candidates-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
