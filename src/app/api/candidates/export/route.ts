import { NextResponse } from "next/server";
import { getShortlistedCandidates, updateAiSummary, candidateToCsvRow, formatProfileForAI } from "@/lib/candidates";
import { askClaude } from "@/lib/claude";
import { PROMPTS } from "@/lib/prompts";
import { CSV_HEADERS } from "@/lib/constants";
import { badRequest } from "@/lib/api";

export async function GET() {
  const candidates = await getShortlistedCandidates();

  if (candidates.length === 0) {
    return badRequest("No shortlisted candidates to export");
  }

  for (const c of candidates) {
    if (!c.aiSummary) {
      try {
        const summary = await askClaude(PROMPTS.SUMMARY, formatProfileForAI(c), 300);
        c.aiSummary = summary;
        await updateAiSummary(c.id, summary);
      } catch {
        c.aiSummary = "";
      }
    }
  }

  const rows = candidates.map(candidateToCsvRow);
  const csv = [CSV_HEADERS.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="shortlisted-candidates-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
