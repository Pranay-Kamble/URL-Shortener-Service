"use client";

import { useState } from "react";
import API_BASE_URL from "../../lib/api";
import {
  Search,
  ExternalLink,
  MousePointerClick,
  Calendar,
  Clock,
  Timer,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Ban,
} from "lucide-react";

interface StatsData {
  longurl: string;
  is_expired: boolean;
  meta_data: {
    clicks: number;
    created_at: string;
    expires_on: string;
    last_click: string | null;
  };
}

export function StatsView() {
  const [shortInput, setShortInput] = useState("");
  const [lastFetchedCode, setLastFetchedCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);

  const extractShortCode = (input: string): string => {
    try {
      const url = new URL(input);
      return url.pathname.replace(/^\//, "");
    } catch {
      return input.trim();
    }
  };

  const fetchStats = async (shortCode: string) => {
    const response = await fetch(`${API_BASE_URL}/stats/${shortCode}`);

    if (response.status === 404) {
      setError("URL not found! The short code does not exist.");
      return null;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch stats");
    }

    return await response.json();
  };

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStats(null);

    const shortCode = extractShortCode(shortInput);

    if (!shortCode) {
      setError("Please enter a short code or URL!");
      return;
    }

    setIsLoading(true);

    try {
      const data = await fetchStats(shortCode);
      if (data) {
        setStats(data);
        setLastFetchedCode(shortCode);
      }
    } catch {
      setError("Could not connect to the server. Please ensure the backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!lastFetchedCode) return;
    setError("");
    setIsRefreshing(true);

    try {
      const data = await fetchStats(lastFetchedCode);
      if (data) {
        setStats(data);
      }
    } catch {
      setError("Could not refresh stats. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleFetch} className="space-y-4">
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground">
            <Search className="h-6 w-6" />
          </div>
          <input
            type="text"
            value={shortInput}
            onChange={(e) => setShortInput(e.target.value)}
            placeholder="Enter short code or short URL..."
            className="w-full bg-input border-4 border-border p-4 pl-14 text-lg font-bold placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-foreground/20 shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
          />
        </div>

        {error && (
          <div className="bg-destructive border-4 border-border p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive-foreground flex-shrink-0" />
            <p className="font-bold text-destructive-foreground">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-secondary border-4 border-border p-4 text-xl font-black text-secondary-foreground hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0_0_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              FETCHING...
            </>
          ) : (
            "FETCH STATS"
          )}
        </button>
      </form>

      {stats && (
        <div
          className={`border-4 border-border p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)] space-y-6 ${
            stats.is_expired ? "bg-muted" : "bg-card"
          }`}
        >
          {/* Header row: label + refresh */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {stats.is_expired && (
                <div className="bg-destructive border-4 border-border px-3 py-1.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] flex items-center gap-2">
                  <Ban className="h-4 w-4 text-destructive-foreground" />
                  <span className="text-xs font-black uppercase tracking-widest text-destructive-foreground">
                    EXPIRED
                  </span>
                </div>
              )}
              <p className="text-sm font-bold uppercase text-muted-foreground">
                {stats.is_expired ? "Original URL" : "Original URL"}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 bg-muted border-4 border-border px-3 py-2 text-sm font-black text-foreground hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all shadow-[4px_4px_0_0_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh stats"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              REFRESH
            </button>
          </div>

          {/* URL Display */}
          {stats.is_expired ? (
            <div className="border-4 border-border p-4 bg-background shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center gap-3">
              <Ban className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-xs font-black uppercase text-muted-foreground mb-0.5">
                  URL Hidden
                </p>
                <p className="text-sm font-bold text-muted-foreground">
                  The original destination is no longer accessible through this link.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <code className="flex-1 bg-muted border-4 border-border p-3 font-mono text-sm font-bold break-all text-card-foreground">
                {stats.longurl}
              </code>
              <a
                href={stats.longurl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary border-4 border-border p-3 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
                aria-label="Open in new tab"
              >
                <ExternalLink className="h-6 w-6 text-primary-foreground" />
              </a>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-primary border-4 border-border p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              <div className="flex items-center gap-2 mb-2">
                <MousePointerClick className="h-5 w-5 text-primary-foreground" />
                <span className="text-sm font-bold uppercase text-primary-foreground">
                  Total Clicks
                </span>
              </div>
              <p className="text-4xl font-black text-primary-foreground">
                {stats.meta_data.clicks}
              </p>
            </div>

            <div className="bg-secondary border-4 border-border p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-secondary-foreground" />
                <span className="text-sm font-bold uppercase text-secondary-foreground">
                  Created
                </span>
              </div>
              <p className="text-sm font-bold text-secondary-foreground">
                {formatDate(stats.meta_data.created_at)}
              </p>
            </div>

            {/* Expired At — highlighted in red when expired */}
            <div
              className={`border-4 border-border p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] ${
                stats.is_expired ? "bg-destructive" : "bg-accent"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Timer
                  className={`h-5 w-5 ${
                    stats.is_expired
                      ? "text-destructive-foreground"
                      : "text-accent-foreground"
                  }`}
                />
                <span
                  className={`text-sm font-bold uppercase ${
                    stats.is_expired
                      ? "text-destructive-foreground"
                      : "text-accent-foreground"
                  }`}
                >
                  {stats.is_expired ? "Expired At" : "Expires At"}
                </span>
              </div>
              <p
                className={`text-sm font-bold ${
                  stats.is_expired
                    ? "text-destructive-foreground"
                    : "text-accent-foreground"
                }`}
              >
                {formatDate(stats.meta_data.expires_on)}
              </p>
            </div>

            <div className="bg-muted border-4 border-border p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-foreground" />
                <span className="text-sm font-bold uppercase text-foreground">
                  Last Click
                </span>
              </div>
              <p className="text-sm font-bold text-foreground">
                {formatDate(stats.meta_data.last_click)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
