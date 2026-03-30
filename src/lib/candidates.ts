import { query, queryOne } from "./db";
import { Candidate, TopRepo } from "./types";
import { ALLOWED_SORTS, PAGINATION, SortField } from "./constants";

// --- Query Helpers ---

interface FilterParams {
  search?: string;
  language?: string;
  location?: string;
  minFollowers?: number;
  minStars?: number;
  shortlisted?: boolean;
}

interface QueryResult {
  whereClause: string;
  values: unknown[];
  nextParamIdx: number;
}

export function buildWhereClause(filters: FilterParams): QueryResult {
  const conditions: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (filters.search) {
    conditions.push(
      `("name" ILIKE $${idx} OR "login" ILIKE $${idx} OR "bio" ILIKE $${idx} OR "company" ILIKE $${idx})`
    );
    values.push(`%${filters.search}%`);
    idx++;
  }

  if (filters.language) {
    conditions.push(`"languages"::text ILIKE $${idx}`);
    values.push(`%${filters.language}%`);
    idx++;
  }

  if (filters.location) {
    conditions.push(`"location" ILIKE $${idx}`);
    values.push(`%${filters.location}%`);
    idx++;
  }

  if (filters.minFollowers && filters.minFollowers > 0) {
    conditions.push(`"followers" >= $${idx}`);
    values.push(filters.minFollowers);
    idx++;
  }

  if (filters.minStars && filters.minStars > 0) {
    conditions.push(`"totalStars" >= $${idx}`);
    values.push(filters.minStars);
    idx++;
  }

  if (filters.shortlisted) {
    conditions.push(`"shortlisted" = true`);
  }

  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    values,
    nextParamIdx: idx,
  };
}

export function safeSortColumn(sortBy: string): string {
  return ALLOWED_SORTS.includes(sortBy as SortField)
    ? `"${sortBy}"`
    : '"followers"';
}

// --- Candidate CRUD ---

export async function findCandidates(
  filters: FilterParams,
  sortBy: string = "followers",
  order: "asc" | "desc" = "desc",
  page: number = PAGINATION.DEFAULT_PAGE,
  limit: number = PAGINATION.DEFAULT_LIMIT
): Promise<{ candidates: Candidate[]; total: number }> {
  const { whereClause, values, nextParamIdx } = buildWhereClause(filters);
  const safeSort = safeSortColumn(sortBy);
  const safeOrder = order === "asc" ? "ASC" : "DESC";
  const offset = (page - 1) * limit;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) FROM "Candidate" ${whereClause}`,
    values
  );

  const candidates = await query<Candidate>(
    `SELECT * FROM "Candidate" ${whereClause}
     ORDER BY ${safeSort} ${safeOrder} NULLS LAST
     LIMIT $${nextParamIdx} OFFSET $${nextParamIdx + 1}`,
    [...values, limit, offset]
  );

  return {
    candidates,
    total: parseInt(countResult[0].count),
  };
}

export async function findCandidateById(id: number): Promise<Candidate | null> {
  return queryOne<Candidate>('SELECT * FROM "Candidate" WHERE "id" = $1', [id]);
}

export async function findCandidatesByIds(ids: number[]): Promise<Candidate[]> {
  if (ids.length === 0) return [];
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
  return query<Candidate>(
    `SELECT * FROM "Candidate" WHERE "id" IN (${placeholders})`,
    ids
  );
}

export async function toggleShortlist(id: number): Promise<Candidate | null> {
  return queryOne<Candidate>(
    `UPDATE "Candidate" SET "shortlisted" = NOT "shortlisted", "updatedAt" = NOW()
     WHERE "id" = $1 RETURNING *`,
    [id]
  );
}

export async function updateNotes(id: number, notes: string): Promise<Candidate | null> {
  return queryOne<Candidate>(
    `UPDATE "Candidate" SET "notes" = $1, "updatedAt" = NOW()
     WHERE "id" = $2 RETURNING *`,
    [notes, id]
  );
}

export async function updateAiSummary(id: number, summary: string): Promise<void> {
  await query(
    'UPDATE "Candidate" SET "aiSummary" = $1, "updatedAt" = NOW() WHERE "id" = $2',
    [summary, id]
  );
}

export async function updateFitScore(id: number, score: number, reason: string): Promise<void> {
  await query(
    'UPDATE "Candidate" SET "fitScore" = $1, "fitReason" = $2, "updatedAt" = NOW() WHERE "id" = $3',
    [score, reason, id]
  );
}

export async function getDistinctLanguages(): Promise<string[]> {
  const rows = await query<{ lang: string }>(
    `SELECT DISTINCT jsonb_array_elements_text("languages") as lang
     FROM "Candidate" WHERE "languages" IS NOT NULL ORDER BY lang`
  );
  return rows.map((r) => r.lang);
}

export async function getShortlistedCandidates(): Promise<Candidate[]> {
  return query<Candidate>(
    `SELECT * FROM "Candidate" WHERE "shortlisted" = true ORDER BY "followers" DESC`
  );
}

export async function getAllCandidateSummaries(): Promise<Array<{ id: number; login: string; name: string | null; company: string | null; location: string | null; languages: string[] | null; followers: number; totalStars: number; publicRepos: number; bio: string | null }>> {
  return query(
    `SELECT "id", "login", "name", "company", "location", "languages", "followers", "totalStars", "publicRepos", "bio"
     FROM "Candidate"`
  );
}

// --- Profile Formatting (shared across AI features) ---

export function formatProfileForAI(c: Candidate, options?: { includeRepos?: boolean; repoLimit?: number }): string {
  const repoLimit = options?.repoLimit ?? 5;
  const repos = options?.includeRepos !== false
    ? c.topRepos?.slice(0, repoLimit).map((r: TopRepo) => ({
        name: r.name,
        stars: r.stars,
        language: r.language,
      })) ?? []
    : [];

  const lines = [
    `Name: ${c.name || c.login}`,
    `Username: ${c.login}`,
    `Bio: ${c.bio || "N/A"}`,
    `Company: ${c.company || "N/A"}`,
    `Location: ${c.location || "N/A"}`,
    `Followers: ${c.followers}`,
    `Total Stars: ${c.totalStars}`,
    `Public Repos: ${c.publicRepos}`,
    `Languages: ${JSON.stringify(c.languages || [])}`,
  ];

  if (repos.length > 0) {
    lines.push(`Top Repos: ${JSON.stringify(repos)}`);
  }

  return lines.join("\n");
}

export function formatProfileCompact(c: { id: number; login: string; name: string | null; company: string | null; languages: string[] | null; followers: number; totalStars: number; publicRepos: number; bio: string | null }): string {
  return `ID:${c.id} ${c.name || c.login} | langs:${JSON.stringify(c.languages)} | followers:${c.followers} | stars:${c.totalStars} | repos:${c.publicRepos} | company:${c.company || ""} | bio:${c.bio || ""}`;
}

// --- CSV Export ---

export function escapeCsv(value: unknown): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function candidateToCsvRow(c: Candidate): string[] {
  return [
    escapeCsv(c.name || c.login),
    escapeCsv(c.login),
    escapeCsv(c.profileUrl),
    escapeCsv(c.email),
    escapeCsv(c.location),
    escapeCsv(c.company),
    escapeCsv(c.bio),
    escapeCsv(c.languages?.join(", ") ?? ""),
    escapeCsv(c.followers),
    escapeCsv(c.totalStars),
    escapeCsv(c.publicRepos),
    escapeCsv(c.blog),
    escapeCsv(c.twitterUsername ? `@${c.twitterUsername}` : ""),
    escapeCsv(c.aiSummary),
  ];
}

// --- Validation ---

export function parseId(value: string): number | null {
  const id = parseInt(value, 10);
  return !isNaN(id) && id > 0 ? id : null;
}

export function parsePagination(params: URLSearchParams) {
  return {
    page: Math.max(1, parseInt(params.get("page") || "1", 10) || 1),
    limit: Math.min(
      PAGINATION.MAX_LIMIT,
      Math.max(1, parseInt(params.get("limit") || String(PAGINATION.DEFAULT_LIMIT), 10) || PAGINATION.DEFAULT_LIMIT)
    ),
  };
}
