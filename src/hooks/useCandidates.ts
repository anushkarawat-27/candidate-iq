"use client";

import { useState, useEffect, useCallback } from "react";
import { Candidate, CandidatesResponse } from "@/lib/types";
import { Filters } from "@/components/FilterBar";
import { showToast } from "@/components/Toast";

export function useCandidates() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shortlistedCount, setShortlistedCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"search" | "shortlisted">("search");
  const [filters, setFilters] = useState<Filters>({
    search: "",
    language: "",
    location: "",
    sortBy: "followers",
  });

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.language) params.set("language", filters.language);
    if (filters.location) params.set("location", filters.location);
    if (filters.sortBy) params.set("sortBy", filters.sortBy);
    if (activeTab === "shortlisted") params.set("shortlisted", "true");
    params.set("page", page.toString());
    params.set("limit", "20");

    try {
      const res = await fetch(`/api/candidates?${params}`);
      if (!res.ok) throw new Error("Failed to load candidates");
      const data: CandidatesResponse = await res.json();
      setCandidates(data.candidates);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setLanguages(data.languages);

      // Fetch global shortlisted count
      const countRes = await fetch("/api/candidates?shortlisted=true&limit=1");
      if (countRes.ok) {
        const countData = await countRes.json();
        setShortlistedCount(countData.total);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load candidates";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  }, [filters, page, activeTab]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const handleFiltersChange = useCallback((newFilters: Filters) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const handleTabChange = useCallback((tab: "search" | "shortlisted") => {
    setActiveTab(tab);
    setPage(1);
  }, []);

  const handleShortlistToggle = async (id: number) => {
    try {
      const res = await fetch(`/api/candidates/${id}/shortlist`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to update shortlist");
      const updated: Candidate = await res.json();
      setCandidates((prev) => prev.map((c) => (c.id === id ? updated : c)));
      setShortlistedCount((prev) => prev + (updated.shortlisted ? 1 : -1));
      showToast(updated.shortlisted ? "Added to shortlist" : "Removed from shortlist");
      return updated;
    } catch (err) {
      showToast("Failed to update shortlist", "error");
      console.error(err);
      return null;
    }
  };

  return {
    candidates, languages, total, totalPages, shortlistedCount,
    page, setPage, loading, error, activeTab, setFilters,
    handleFiltersChange, handleTabChange, handleShortlistToggle,
  };
}
