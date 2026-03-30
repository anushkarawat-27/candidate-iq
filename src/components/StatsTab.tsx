"use client";

import { Candidate } from "@/lib/types";
import { formatNumber, formatDate } from "@/lib/utils";

interface StatsTabProps {
  candidate: Candidate;
}

export default function StatsTab({ candidate }: StatsTabProps) {
  const stats = [
    { label: "Followers", value: formatNumber(candidate.followers) },
    { label: "Following", value: formatNumber(candidate.following) },
    { label: "Owned Repos", value: formatNumber(candidate.topRepos?.length ?? 0) },
    { label: "Public Repos (incl. forks)", value: formatNumber(candidate.publicRepos) },
    { label: "Total Stars", value: formatNumber(candidate.totalStars) },
  ];

  return (
    <div className="space-y-1">
      {stats.map((stat) => (
        <div key={stat.label} className="flex items-center justify-between py-2.5 border-b border-gray-50">
          <span className="text-sm text-gray-400">{stat.label}</span>
          <span className="text-sm font-semibold text-primary-900 tabular-nums">{stat.value}</span>
        </div>
      ))}
      <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
        <span className="text-sm text-gray-400">Account Created</span>
        <span className="text-sm font-semibold text-primary-900">{formatDate(candidate.createdAtGh)}</span>
      </div>
    </div>
  );
}
