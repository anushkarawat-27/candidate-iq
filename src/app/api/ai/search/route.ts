import { NextRequest, NextResponse } from "next/server";
import { askClaude, parseJsonResponse } from "@/lib/claude";
import { buildWhereClause, safeSortColumn } from "@/lib/candidates";
import { query } from "@/lib/db";
import { Candidate } from "@/lib/types";
import { PROMPTS } from "@/lib/prompts";
import { badRequest, errorResponse } from "@/lib/api";

interface ParsedFilters {
  search: string;
  language: string;
  location: string;
  minFollowers: number;
  minStars: number;
  sortBy: string;
  interpretation: string;
}

export async function POST(req: NextRequest) {
  try {
    const { query: userQuery } = await req.json();

    if (!userQuery || typeof userQuery !== "string") {
      return badRequest("Query is required");
    }

    const result = await askClaude(PROMPTS.SEARCH, userQuery, 256);
    const filters = parseJsonResponse<ParsedFilters>(result);

    if (!filters) {
      return errorResponse("Failed to parse AI response");
    }

    const { whereClause, values } = buildWhereClause({
      search: filters.search || undefined,
      language: filters.language || undefined,
      location: filters.location || undefined,
      minFollowers: filters.minFollowers,
      minStars: filters.minStars,
    });

    const sortColumn = safeSortColumn(filters.sortBy);

    const candidates = await query<Candidate>(
      `SELECT * FROM "Candidate" ${whereClause} ORDER BY ${sortColumn} DESC NULLS LAST LIMIT 20`,
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
    return errorResponse("AI search failed");
  }
}
