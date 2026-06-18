"use client";

import { useState, useRef } from "react";
import API_BASE_URL from "../../lib/api";
import {
  Link2,
  Copy,
  Check,
  QrCode,
  Download,
  Loader2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

interface ShortenResult {
  shorturl: string;
}

// Preset options: label, value in hours
const DURATION_PRESETS = [
  { label: "5 MIN", hours: 5 / 60 },
  { label: "1 HR", hours: 1 },
  { label: "12 HRS", hours: 12 },
  { label: "1 DAY", hours: 24 },
  { label: "3 DAYS", hours: 72 },
  { label: "5 DAYS", hours: 120 },
] as const;

const MIN_HOURS = 5 / 60; // 5 minutes
const MAX_HOURS = 120; // 5 days

export function ShortenForm() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ShortenResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Duration state
  const [selectedPreset, setSelectedPreset] = useState<number>(72); // default 3 days
  const [customHours, setCustomHours] = useState<string>("");
  const [useCustom, setUseCustom] = useState(false);

  const qrRef = useRef<HTMLCanvasElement>(null);

  const isValidUrl = (string: string) => {
    try {
      const u = new URL(string);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  const getEffectiveDuration = (): number => {
    if (useCustom) {
      const val = parseFloat(customHours);
      if (isNaN(val)) return selectedPreset;
      return Math.min(MAX_HOURS, Math.max(MIN_HOURS, val));
    }
    return selectedPreset;
  };

  const formatDuration = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} min`;
    } else if (hours < 24) {
      return `${hours} hr${hours !== 1 ? "s" : ""}`;
    } else {
      const days = hours / 24;
      return `${days} day${days !== 1 ? "s" : ""}`;
    }
  };

  const handleCustomHoursChange = (val: string) => {
    setCustomHours(val);
    const num = parseFloat(val);
    if (!isNaN(num)) {
      if (num < MIN_HOURS) {
        setError(`Minimum expiry is 5 minutes (${MIN_HOURS.toFixed(4)} hrs).`);
      } else if (num > MAX_HOURS) {
        setError(`Maximum expiry is 5 days (120 hrs).`);
      } else {
        setError("");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setShowQR(false);

    if (!url.trim()) {
      setError("URL cannot be empty!");
      return;
    }

    if (!isValidUrl(url)) {
      setError("Invalid URL! Must start with http:// or https://");
      return;
    }

    const duration = getEffectiveDuration();

    if (duration < MIN_HOURS) {
      setError("Minimum expiry time is 5 minutes.");
      return;
    }
    if (duration > MAX_HOURS) {
      setError("Maximum expiry time is 5 days (120 hours).");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/shorten`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, duration }),
      });

      if (!response.ok) {
        throw new Error("Failed to shorten URL");
      }

      const data = await response.json();
      setResult(data);
    } catch {
      setError("Could not connect to the server. Please ensure the backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (result?.shorturl) {
      const fullUrl = `${window.location.origin}/${result.shorturl}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadQR = () => {
    const canvas = qrRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `qr-${result?.shorturl}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  const effectiveDuration = getEffectiveDuration();

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* URL Input */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground">
            <Link2 className="h-6 w-6" />
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter a long URL here..."
            className="w-full bg-input border-4 border-border p-4 pl-14 text-lg font-bold placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-foreground/20 shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
          />
        </div>

        {/* Duration Picker */}
        <div className="bg-muted border-4 border-border p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-foreground" />
            <span className="text-sm font-black uppercase text-foreground tracking-wider">
              Expiry Duration
            </span>
            <span className="ml-auto bg-foreground text-background text-xs font-black px-2 py-1 border-2 border-border">
              {useCustom && customHours
                ? isNaN(parseFloat(customHours))
                  ? "INVALID"
                  : formatDuration(
                      Math.min(MAX_HOURS, Math.max(MIN_HOURS, parseFloat(customHours)))
                    ).toUpperCase()
                : formatDuration(selectedPreset).toUpperCase()}
            </span>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {DURATION_PRESETS.map((preset) => {
              const isActive = !useCustom && selectedPreset === preset.hours;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setSelectedPreset(preset.hours);
                    setUseCustom(false);
                    setCustomHours("");
                    setError("");
                  }}
                  className={`
                    border-4 border-border p-2 text-xs font-black uppercase tracking-wider
                    transition-all
                    ${
                      isActive
                        ? "bg-foreground text-background translate-x-0.5 translate-y-0.5 shadow-none"
                        : "bg-card text-foreground shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
                    }
                  `}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Custom Input Toggle */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setUseCustom(!useCustom);
                if (useCustom) {
                  setCustomHours("");
                  setError("");
                }
              }}
              className={`
                border-4 border-border px-3 py-1.5 text-xs font-black uppercase tracking-wider transition-all
                ${
                  useCustom
                    ? "bg-foreground text-background translate-x-0.5 translate-y-0.5 shadow-none"
                    : "bg-card text-foreground shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
                }
              `}
            >
              CUSTOM
            </button>

            {useCustom && (
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="number"
                  min={MIN_HOURS}
                  max={MAX_HOURS}
                  step="0.01"
                  value={customHours}
                  onChange={(e) => handleCustomHoursChange(e.target.value)}
                  placeholder="e.g. 48"
                  className="flex-1 bg-input border-4 border-border px-3 py-1.5 text-sm font-bold placeholder:text-muted-foreground focus:outline-none focus:ring-4 focus:ring-foreground/20 shadow-[3px_3px_0_0_rgba(0,0,0,1)]"
                />
                <span className="text-xs font-black text-muted-foreground uppercase">
                  HRS
                </span>
              </div>
            )}
          </div>

          {/* Constraints hint */}
          <p className="text-xs font-bold text-muted-foreground">
            MIN: 5 minutes &nbsp;·&nbsp; MAX: 5 days (120 hrs)
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-destructive border-4 border-border p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive-foreground flex-shrink-0" />
            <p className="font-bold text-destructive-foreground">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary border-4 border-border p-4 text-xl font-black text-primary-foreground hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0_0_rgba(0,0,0,1)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              SHORTENING...
            </>
          ) : (
            `SHORTEN IT · EXPIRES IN ${useCustom && customHours && !isNaN(parseFloat(customHours)) ? formatDuration(Math.min(MAX_HOURS, Math.max(MIN_HOURS, parseFloat(customHours)))).toUpperCase() : formatDuration(effectiveDuration).toUpperCase()}`
          )}
        </button>
      </form>

      {result && (
        <div className="space-y-4">
          <div className="bg-secondary border-4 border-border p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            <p className="text-sm font-bold uppercase mb-2 text-secondary-foreground">
              Your Shortened URL
            </p>
            <div className="flex items-center gap-3">
              <code className="flex-1 bg-card border-4 border-border p-3 font-mono text-lg font-bold break-all text-card-foreground">
                {`${window.location.origin}/${result.shorturl}`}
              </code>
              <button
                onClick={copyToClipboard}
                className="bg-primary border-4 border-border p-3 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
                aria-label="Copy to clipboard"
              >
                {copied ? (
                  <Check className="h-6 w-6 text-primary-foreground" />
                ) : (
                  <Copy className="h-6 w-6 text-primary-foreground" />
                )}
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowQR(!showQR)}
            className="bg-accent border-4 border-border p-4 font-black text-accent-foreground hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center gap-2"
          >
            <QrCode className="h-5 w-5" />
            {showQR ? "HIDE QR CODE" : "SHOW QR CODE"}
          </button>

          {showQR && (
            <div className="bg-card border-4 border-border p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex flex-col items-center gap-4">
              <div className="bg-white p-4 border-4 border-border">
                <QRCodeCanvas
                  ref={qrRef}
                  value={`${window.location.origin}/${result.shorturl}`}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <button
                onClick={downloadQR}
                className="bg-primary border-4 border-border p-3 px-6 font-black text-primary-foreground hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center gap-2"
              >
                <Download className="h-5 w-5" />
                DOWNLOAD QR
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
