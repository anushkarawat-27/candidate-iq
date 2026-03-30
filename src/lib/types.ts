export interface Candidate {
  id: number;
  githubId: number;
  login: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  email: string | null;
  hireable: boolean | null;
  twitterUsername: string | null;
  publicRepos: number;
  followers: number;
  following: number;
  profileUrl: string;
  createdAtGh: string;
  languages: string[] | null;
  topRepos: TopRepo[] | null;
  totalStars: number;
  shortlisted: boolean;
  aiSummary: string | null;
  fitScore: number | null;
  fitReason: string | null;
  notes: string | null;
  similarityReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TopRepo {
  name: string;
  stars: number;
  language: string | null;
  description: string;
  url: string;
}

export interface CandidatesResponse {
  candidates: Candidate[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  languages: string[];
}
