import { Candidate } from "./types";

/**
 * Fallback responses when ANTHROPIC_API_KEY is not configured.
 * Returns realistic mock data so the demo still functions.
 */

export function fallbackSummary(c: Candidate): string {
  const langs = c.languages?.slice(0, 3).join(", ") || "various languages";
  const signal = c.followers > 1000
    ? `a well-known developer with ${c.followers.toLocaleString()} followers`
    : "an active developer";
  const location = c.location ? ` Based in ${c.location}.` : "";
  return `${signal} focused on ${langs}, with ${c.totalStars.toLocaleString()} total stars across ${c.topRepos?.length ?? 0} repositories.${location} ${c.company ? `Currently at ${c.company}.` : ""}`.trim();
}

export function fallbackFitScore(c: Candidate, roleDescription: string): { score: number; reason: string } {
  const roleLower = roleDescription.toLowerCase();
  const candidateLangs = (c.languages || []).map((l) => l.toLowerCase());

  let score = 30; // base score

  // Language match
  const langKeywords = ["go", "python", "rust", "javascript", "typescript", "java", "ruby", "c++", "c#", "swift", "kotlin"];
  for (const lang of langKeywords) {
    if (roleLower.includes(lang) && candidateLangs.some((cl) => cl.toLowerCase().includes(lang))) {
      score += 25;
      break;
    }
  }

  // Activity signals
  if (c.followers > 5000) score += 15;
  else if (c.followers > 500) score += 10;
  else if (c.followers > 50) score += 5;

  if (c.totalStars > 1000) score += 10;
  else if (c.totalStars > 100) score += 5;

  // Location match
  if (c.location && roleLower.includes(c.location.toLowerCase().split(",")[0])) {
    score += 10;
  }

  score = Math.min(score, 95);

  const langs = c.languages?.slice(0, 2).join("/") || "general";
  const reason = score >= 70
    ? `Strong ${langs} background with solid community presence.`
    : score >= 40
      ? `Some relevant experience in ${langs}, moderate activity level.`
      : `Limited overlap with role requirements based on public profile.`;

  return { score, reason };
}

export function fallbackSearch(query: string): {
  search: string;
  language: string;
  location: string;
  minFollowers: number;
  minStars: number;
  sortBy: string;
  interpretation: string;
} {
  const q = query.toLowerCase();

  // Simple keyword extraction
  const langKeywords: Record<string, string> = {
    python: "Python", go: "Go", rust: "Rust", javascript: "JavaScript",
    typescript: "TypeScript", ruby: "Ruby", java: "Java", "c++": "C++",
    swift: "Swift", elixir: "Elixir",
  };

  let language = "";
  for (const [key, val] of Object.entries(langKeywords)) {
    if (q.includes(key)) { language = val; break; }
  }

  const locationPatterns = ["san francisco", "new york", "berlin", "london", "portland", "austin", "seattle"];
  let location = "";
  for (const loc of locationPatterns) {
    if (q.includes(loc)) { location = loc.split(" ").map((w) => w[0].toUpperCase() + w.slice(1)).join(" "); break; }
  }

  return {
    search: "",
    language,
    location,
    minFollowers: q.includes("popular") || q.includes("lots of followers") ? 100 : 0,
    minStars: q.includes("stars") ? 50 : 0,
    sortBy: "followers",
    interpretation: `Searching for ${language || "all"} developers${location ? ` in ${location}` : ""} (demo mode — AI key not configured).`,
  };
}

export function fallbackSimilar(source: Candidate, allCandidates: Candidate[]): Array<{ id: number; reason: string }> {
  const sourceLangs = new Set(source.languages || []);

  const scored = allCandidates
    .filter((c) => c.id !== source.id)
    .map((c) => {
      const cLangs = new Set(c.languages || []);
      const overlap = Array.from(sourceLangs).filter((l) => cLangs.has(l)).length;
      const followerSim = 1 - Math.abs(Math.log10((c.followers + 1) / (source.followers + 1)));
      return { id: c.id, score: overlap * 10 + followerSim * 5, name: c.name || c.login, langs: c.languages?.slice(0, 2).join("/") || "" };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return scored.map((s) => ({
    id: s.id,
    reason: `Similar ${s.langs} background and activity level (demo mode).`,
  }));
}

export function fallbackCompare(candidates: Candidate[]): string {
  const lines = candidates.map((c) => {
    const name = c.name || c.login;
    const langs = c.languages?.slice(0, 3).join(", ") || "various";
    return `**${name}** — ${langs} developer with ${c.followers.toLocaleString()} followers and ${c.totalStars.toLocaleString()} stars.`;
  });

  const top = candidates.sort((a, b) => b.followers + b.totalStars - a.followers - a.totalStars)[0];
  return [
    "**Overview**",
    ...lines,
    "",
    `**Recommendation:** ${top.name || top.login} stands out with the strongest community presence. (Demo mode — AI key not configured.)`,
  ].join("\n");
}
