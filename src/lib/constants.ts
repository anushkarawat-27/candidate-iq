export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const ALLOWED_SORTS = [
  "followers",
  "totalStars",
  "publicRepos",
  "name",
  "login",
  "fitScore",
] as const;

export type SortField = (typeof ALLOWED_SORTS)[number];

export const CLAUDE_MODEL = "claude-sonnet-4-20250514" as const;

export const AI_TOKEN_LIMITS = {
  SEARCH: 256,
  SUMMARY: 300,
  SIMILAR: 512,
  COMPARE: 600,
  FIT: 150,
} as const;

export const CSV_HEADERS = [
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
  "Fit Score",
  "Fit Reason",
  "Notes",
  "AI Summary",
] as const;
