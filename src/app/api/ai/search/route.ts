import { NextRequest, NextResponse } from "next/server";
import { askClaude, parseJsonResponse, AI_AVAILABLE } from "@/lib/claude";
import { buildWhereClause, safeSortColumn } from "@/lib/candidates";
import { query } from "@/lib/db";
import { Candidate } from "@/lib/types";
import { PROMPTS } from "@/lib/prompts";
import { AI_TOKEN_LIMITS } from "@/lib/constants";
import { errorResponse, parseBody, searchSchema } from "@/lib/api";
import { fallbackSearch } from "@/lib/ai-fallback";

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
    const parsed = await parseBody(req, searchSchema);
    if ("error" in parsed) return parsed.error;

    let filters: ParsedFilters;

    if (AI_AVAILABLE) {
      const result = await askClaude(PROMPTS.SEARCH, parsed.data.query, AI_TOKEN_LIMITS.SEARCH);
      const aiFilters = parseJsonResponse<ParsedFilters>(result);
      if (!aiFilters) return errorResponse("Failed to parse AI response");
      filters = aiFilters;
    } else {
      filters = fallbackSearch(parsed.data.query);
    }

    const { whereClause, values } = buildWhereClause({
      search: filters.search || undefined,
      language: filters.language || undefined,
      location: filters.location || undefined,
      minFollowers: filters.minFollowers,
      minStars: filters.minStars,
    });

    const candidates = await query<Candidate>(
      `SELECT * FROM "Candidate" ${whereClause} ORDER BY ${safeSortColumn(filters.sortBy)} DESC NULLS LAST LIMIT 20`,
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
