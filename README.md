# CandidateIQ

A candidate intelligence platform that helps recruiters browse, evaluate, and compare developer candidates using data from GitHub and AI-powered analysis.

**Live Demo:** https://candidate-iq-theta.vercel.app

## What I Built

A full-stack recruiting tool that takes raw GitHub profile data and transforms it into an actionable interface for recruiters. The core insight: recruiters don't think in repos and stars — they think in "is this person right for my role?" So every feature is built around that question.

### Key Features

- **Role-based workflow** — Set the role you're hiring for (e.g. "Senior Backend Engineer, Go/Python") and every candidate gets an AI-generated fit score with reasoning
- **Natural language search** — Type "Python developers in San Francisco" instead of configuring dropdown filters
- **AI candidate summaries** — One-click recruiter-readable summaries generated from GitHub data
- **Find similar** — Click any strong candidate and discover others like them
- **Batch comparison** — Select 2-4 candidates and get an AI-generated comparison brief
- **Shortlisting + CSV export** — Build a shortlist, add notes, export everything (including AI summaries, fit scores, and notes) as CSV
- **Keyboard shortcuts** — j/k to navigate, s to shortlist, Esc to close

### AI Fallback

All AI features work without an Anthropic API key. When `ANTHROPIC_API_KEY` is not set, the app uses heuristic-based fallbacks:
- Search uses keyword extraction instead of Claude
- Fit scoring uses language matching + activity signals
- Summaries are generated from profile stats
- Similarity uses language overlap scoring
- Comparisons are built from structured profile data

Responses in demo mode are marked with "(demo mode)".

## Architecture

```
Next.js 14 (App Router)
├── Frontend: React + Tailwind CSS
├── API: Next.js API routes
├── Database: PostgreSQL (Supabase)
├── AI: Claude API (Anthropic SDK)
└── Data source: GitHub REST API
```

### Why This Stack

- **Next.js** — API routes + React in one project. Simpler deployment, shared types across layers.
- **Raw SQL via `pg`** — Prisma's engine couldn't connect to Supabase's pooler, so I used `pg` directly with a typed service layer. This ended up being a cleaner abstraction anyway — full control over queries without ORM magic.
- **Supabase Postgres** — Free tier, hosted, connection pooling. Chose over SQLite because the deployed demo needs a shared database.
- **Tailwind** — Fast iteration on UI. Every component uses the same design tokens (primary-500, rounded-xl, etc.)

### Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── candidates/     # CRUD: list, detail, shortlist, notes, export
│   │   └── ai/             # AI: search, summary, similar, compare, fit
│   └── page.tsx            # Main dashboard (260 lines)
├── components/
│   ├── CandidateList.tsx   # Full-width row list with headers + pagination
│   ├── CandidateCard.tsx   # Single candidate row
│   ├── DetailPanel.tsx     # Slide-over detail view (165 lines)
│   ├── SummaryTab.tsx      # AI summary, stats, notes, contact
│   ├── ReposTab.tsx        # Sortable/filterable repo list
│   ├── StatsTab.tsx        # Detailed statistics
│   ├── FilterBar.tsx       # Search, language, location, sort
│   ├── RoleBar.tsx         # Role context with onboarding
│   ├── AISearch.tsx        # Natural language search UI
│   ├── CompareModal.tsx    # Batch comparison modal
│   └── ui/                 # Reusable: LoadingSpinner, AnimatedCounter
├── hooks/
│   ├── useCandidates.ts    # Fetch, filter, paginate, shortlist
│   ├── useAutoSave.ts      # Debounced field saving
│   └── useKeyboardShortcuts.ts
└── lib/
    ├── db.ts               # PostgreSQL connection pool
    ├── candidates.ts       # Service layer: queries, formatting, validation
    ├── claude.ts           # Anthropic client + JSON parser
    ├── ai-fallback.ts      # Heuristic fallbacks when no API key
    ├── prompts.ts          # All 5 Claude system prompts
    ├── api.ts              # Zod schemas + error response helpers
    ├── constants.ts        # Pagination, sort fields, token limits
    ├── env.ts              # Environment validation (Zod)
    ├── types.ts            # Candidate, TopRepo, CandidatesResponse
    └── utils.ts            # formatNumber, formatDate
```

## Data Model

```sql
CREATE TABLE "Candidate" (
  "id"              SERIAL PRIMARY KEY,
  "githubId"        INTEGER NOT NULL UNIQUE,
  "login"           VARCHAR(255) NOT NULL UNIQUE,
  "name"            VARCHAR(255),
  "avatarUrl"       TEXT NOT NULL,
  "bio"             TEXT,
  "company"         VARCHAR(255),
  "location"        VARCHAR(255),
  "blog"            TEXT,
  "email"           VARCHAR(255),
  "hireable"        BOOLEAN,
  "twitterUsername"  VARCHAR(255),
  "publicRepos"     INTEGER DEFAULT 0,
  "followers"       INTEGER DEFAULT 0,
  "following"       INTEGER DEFAULT 0,
  "profileUrl"      TEXT NOT NULL,
  "createdAtGh"     TIMESTAMP NOT NULL,
  "languages"       JSONB,          -- ["Go", "Python", "Rust"]
  "topRepos"        JSONB,          -- [{name, stars, language, description, url}]
  "totalStars"      INTEGER DEFAULT 0,
  "shortlisted"     BOOLEAN DEFAULT false,
  "aiSummary"       TEXT,           -- Cached Claude-generated summary
  "fitScore"        INTEGER,        -- 0-100 role fit score
  "fitReason"       TEXT,           -- One-line fit explanation
  "notes"           TEXT,           -- Recruiter's notes
  "createdAt"       TIMESTAMP DEFAULT NOW(),
  "updatedAt"       TIMESTAMP DEFAULT NOW()
);
```

**Design decisions:**
- `languages` and `topRepos` as JSONB — avoids normalization overhead for read-heavy data that's always fetched together. Tradeoff: harder to query individual repos, but we never need to.
- `aiSummary`, `fitScore`, `fitReason` cached on the candidate row — avoids re-calling Claude for the same data. Summaries persist across sessions.
- `notes` on the candidate row (not a separate table) — single recruiter use case, no need for multi-user note history.
- Indexes on `login`, `location`, `followers`, `totalStars` for filter/sort performance.

## AI Features

### How It Works

Each AI feature follows the same pattern:
1. Collect candidate data from the database
2. Format it into a structured profile string (`formatProfileForAI()`)
3. Send to Claude with a purpose-specific system prompt
4. Parse the structured JSON or text response
5. Cache results in the database where applicable

### The 5 AI Features

**1. Natural Language Search**
- Recruiter types: "Go developers in San Francisco with 500+ followers"
- Claude parses this into structured filters: `{language: "Go", location: "San Francisco", minFollowers: 500}`
- Filters are applied as SQL WHERE clauses against the database
- The prompt explicitly tells Claude to ignore generic terms like "engineer" or "developer" since everyone in the database is a developer

**2. Candidate Summaries**
- Takes a candidate's full profile (name, bio, company, languages, top repos, stats)
- Claude generates a 2-3 sentence recruiter-readable summary
- Cached in `aiSummary` column so it's only generated once
- Also generated lazily during CSV export for any candidate missing a summary

**3. Role Fit Scoring**
- Recruiter sets a role description (e.g. "Senior Backend Engineer, Go/Python, remote")
- Claude scores each candidate 0-100 and provides a one-sentence reason
- Considers: language match, experience signals, activity level, location
- Scores are cached in `fitScore`/`fitReason` and used for sorting

**4. Find Similar**
- Given a source candidate, sends their profile + a compact summary of all other candidates to Claude
- Claude identifies the top 5 most similar based on languages, activity, seniority signals
- Returns candidates with similarity reasons attached

**5. Batch Comparison**
- Select 2-4 candidates via checkboxes
- Claude generates a comparison brief: overview, per-candidate strengths, recommendation
- Helps recruiters decide who to reach out to first

### Prompt Design

All prompts are centralized in `src/lib/prompts.ts`. Key design decisions:
- System prompts are explicit about response format (JSON schemas specified)
- Search prompt includes rules to prevent generic terms from polluting results
- Fit scoring prompt considers multiple dimensions (not just language match)
- All prompts instruct Claude to be concise — recruiters scan, they don't read essays

## What I'd Improve With More Time

- **Authentication** — Multi-user support with user-specific shortlists and notes
- **Candidate pipeline** — Replace binary shortlisted/not with stages: New, Reviewed, Contacted, Interested, Passed
- **Better data** — Seed from GitHub's search API to get higher-quality, more diverse profiles (current seed uses sequential user IDs)
- **Outreach templates** — Generate personalized outreach emails based on candidate profile + role
- **Real-time updates** — WebSocket or polling for collaborative recruiting teams
- **Analytics** — Track which candidates get shortlisted, which roles have the best pipeline
- **Testing** — Unit tests for service layer, integration tests for API routes, E2E tests with Playwright
- **Rate limiting** — Protect AI endpoints from abuse, especially in deployed demo

## Running Locally

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in: DATABASE_URL, ANTHROPIC_API_KEY (optional), GITHUB_TOKEN (optional)

# Start development server
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Supabase pooler) |
| `ANTHROPIC_API_KEY` | No | Claude API key. AI features use heuristic fallbacks without it. |
| `GITHUB_TOKEN` | No | GitHub PAT for seeding. Increases rate limit from 60 to 5000 req/hr. |
