"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import { TabToggle } from "./tab-toggle";
import { ShortenForm } from "./shorten-form";
import { StatsView } from "./stats-view";

export function UrlShortener() {
  const [activeTab, setActiveTab] = useState<"shorten" | "retrieve">("shorten");

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 bg-card border-4 border-border p-4 px-8 shadow-[8px_8px_0_0_rgba(0,0,0,1)] mb-6">
            <Link2 className="h-10 w-10 text-foreground" />
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              URL SHORTENER
            </h1>
          </div>
          <p className="text-muted-foreground font-bold">
            Shorten your long URLs into neat, shareable links
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <TabToggle activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Content */}
        <div className="bg-card border-4 border-border p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
          {activeTab === "shorten" ? <ShortenForm /> : <StatsView />}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm font-bold text-muted-foreground">
            Built with Neo-Brutalism vibes
          </p>
        </div>
      </div>
    </div>
  );
}
