import { NextRequest, NextResponse } from "next/server";
import { askClaude } from "@/lib/claude";
import { query } from "@/lib/db";

const SYSTEM_PROMPT = `You are a search query parser for a developer candidate database (sourced from GitHub profiles).
Given a natural language search query from a recruiter, extract structured filters.

The database has these filterable fields:
- name (text, the person's real name)
- login (text, GitHub username)
- bio (text, their GitHub bio)
- company (text, their employer name)
- location (text, e.g. "San Francisco", "Berlin", "New York")
- languages (JSON array of programming languages like "Go", "Python", "Rust", "JavaScript", "TypeScript", etc.)
- followers (integer)
- totalStars (integer, total GitHub stars across all repos)
- publicRepos (integer)

IMPORTANT RULES:
- The "search" field should ONLY contain specific keywords to match in name/bio/company. Do NOT put generic terms like "engineer", "developer", "programmer", "coder" in search — everyone in this database is a developer already.
- If the query mentions a programming language, put it in "language", NOT in "search".
- If the query mentions a location/city/country, put it in "location".
- If no specific name/company keyword is mentioned, leave "search" as "".
- Use loose/partial location terms (e.g. "San Francisco" not "San Francisco, CA").

Respond ONLY with valid JSON in this exact format, no explanation:
{
  "search": "specific name or company keyword" or "",
  "language": "single primary language" or "",
  "location": "location text" or "",
  "minFollowers": number or 0,
  "minStars": number or 0,
  "sortBy": "followers" or "totalStars" or "publicRepos",
  "interpretation": "one sentence explaining how you interpreted the query"
}`;

export async function POST(req: NextRequest) {
  try {
    const { query: userQuery } = await req.json();

    if (!userQuery || typeof userQuery !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const result = await askClaude(SYSTEM_PROMPT, userQuery, 256);

    let filters;
    try {
      filters = JSON.parse(result);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response", raw: result },
        { status: 500 }
      );
    }

    // Build SQL query from parsed filters
    const conditions: string[] = [];
    const values: unknown[] = [];
    let paramIdx = 1;

    if (filters.search) {
      conditions.push(
        `("name" ILIKE $${paramIdx} OR "login" ILIKE $${paramIdx} OR "bio" ILIKE $${paramIdx} OR "company" ILIKE $${paramIdx})`
      );
      values.push(`%${filters.search}%`);
      paramIdx++;
    }

    if (filters.language) {
      conditions.push(`"languages"::text ILIKE $${paramIdx}`);
      values.push(`%${filters.language}%`);
      paramIdx++;
    }

    if (filters.location) {
      conditions.push(`"location" ILIKE $${paramIdx}`);
      values.push(`%${filters.location}%`);
      paramIdx++;
    }

    if (filters.minFollowers > 0) {
      conditions.push(`"followers" >= $${paramIdx}`);
      values.push(filters.minFollowers);
      paramIdx++;
    }

    if (filters.minStars > 0) {
      conditions.push(`"totalStars" >= $${paramIdx}`);
      values.push(filters.minStars);
      paramIdx++;
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const allowedSorts = ["followers", "totalStars", "publicRepos"];
    const sortBy = allowedSorts.includes(filters.sortBy)
      ? `"${filters.sortBy}"`
      : '"followers"';

    const candidates = await query(
      `SELECT * FROM "Candidate" ${whereClause} ORDER BY ${sortBy} DESC NULLS LAST LIMIT 20`,
      values
    );

    return NextResponse.json({
      candidates,
      total: candidates.length,
      filters,
      interpretation: filters.interpretation,
    });
  } catch (err) {
    console.error("AI search error:", err);
    return NextResponse.json(
      { error: "AI search failed" },
      { status: 500 }
    );
  }
}
