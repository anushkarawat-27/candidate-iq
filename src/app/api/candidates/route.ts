import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const search = params.get("search") || "";
  const language = params.get("language") || "";
  const location = params.get("location") || "";
  const minFollowers = parseInt(params.get("minFollowers") || "0");
  const sortBy = params.get("sortBy") || "followers";
  const order = params.get("order") || "desc";
  const page = Math.max(1, parseInt(params.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(params.get("limit") || "20")));
  const shortlisted = params.get("shortlisted");
  const offset = (page - 1) * limit;

  const allowedSorts = ["followers", "totalStars", "publicRepos", "name", "login", "fitScore"];
  const safeSort = allowedSorts.includes(sortBy) ? `"${sortBy}"` : '"followers"';
  const safeOrder = order === "asc" ? "ASC" : "DESC";

  const conditions: string[] = [];
  const values: unknown[] = [];
  let paramIdx = 1;

  if (search) {
    conditions.push(
      `("name" ILIKE $${paramIdx} OR "login" ILIKE $${paramIdx} OR "bio" ILIKE $${paramIdx} OR "company" ILIKE $${paramIdx})`
    );
    values.push(`%${search}%`);
    paramIdx++;
  }

  if (language) {
    conditions.push(`"languages"::text ILIKE $${paramIdx}`);
    values.push(`%${language}%`);
    paramIdx++;
  }

  if (location) {
    conditions.push(`"location" ILIKE $${paramIdx}`);
    values.push(`%${location}%`);
    paramIdx++;
  }

  if (minFollowers > 0) {
    conditions.push(`"followers" >= $${paramIdx}`);
    values.push(minFollowers);
    paramIdx++;
  }

  if (shortlisted === "true") {
    conditions.push(`"shortlisted" = true`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM "Candidate" ${whereClause}`,
    values
  );
  const total = parseInt(countResult[0].count);

  const candidates = await query(
    `SELECT * FROM "Candidate" ${whereClause}
     ORDER BY ${safeSort} ${safeOrder} NULLS LAST
     LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
    [...values, limit, offset]
  );

  const languages = await query<{ lang: string }>(
    `SELECT DISTINCT jsonb_array_elements_text("languages") as lang
     FROM "Candidate" WHERE "languages" IS NOT NULL ORDER BY lang`
  );

  return NextResponse.json({
    candidates,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    languages: languages.map((l) => l.lang),
  });
}
