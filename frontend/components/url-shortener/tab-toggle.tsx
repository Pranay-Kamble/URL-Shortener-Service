"use client";

interface TabToggleProps {
  activeTab: "shorten" | "retrieve";
  onTabChange: (tab: "shorten" | "retrieve") => void;
}

export function TabToggle({ activeTab, onTabChange }: TabToggleProps) {
  return (
    <div className="flex border-4 border-border shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
      <button
        onClick={() => onTabChange("shorten")}
        className={`flex-1 p-4 text-lg font-black transition-colors ${
          activeTab === "shorten"
            ? "bg-primary text-primary-foreground"
            : "bg-card text-card-foreground hover:bg-muted"
        }`}
      >
        SHORTEN
      </button>
      <div className="w-1 bg-border" />
      <button
        onClick={() => onTabChange("retrieve")}
        className={`flex-1 p-4 text-lg font-black transition-colors ${
          activeTab === "retrieve"
            ? "bg-secondary text-secondary-foreground"
            : "bg-card text-card-foreground hover:bg-muted"
        }`}
      >
        RETRIEVE
      </button>
    </div>
  );
}
