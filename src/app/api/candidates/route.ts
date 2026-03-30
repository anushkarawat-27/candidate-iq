import { NextRequest, NextResponse } from "next/server";
import { findCandidates, getDistinctLanguages, parsePagination } from "@/lib/candidates";

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const { page, limit } = parsePagination(params);

  const filters = {
    search: params.get("search") || undefined,
    language: params.get("language") || undefined,
    location: params.get("location") || undefined,
    minFollowers: parseInt(params.get("minFollowers") || "0") || undefined,
    shortlisted: params.get("shortlisted") === "true" || undefined,
  };

  const sortBy = params.get("sortBy") || "followers";
  const order = (params.get("order") || "desc") as "asc" | "desc";

  const { candidates, total } = await findCandidates(filters, sortBy, order, page, limit);
  const languages = await getDistinctLanguages();

  return NextResponse.json({
    candidates,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    languages,
  });
}
