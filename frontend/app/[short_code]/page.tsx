import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, Clock, Home, Search } from "lucide-react";

// Server components use BACKEND_URL (non-public) — can be an internal URL on Railway.
// Falls back to localhost for local development.
const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000";

interface Props {
  params: Promise<{ short_code: string }>;
}

export default async function ShortCodeRedirectPage({ params }: Props) {
  const { short_code } = await params;

  const response = await fetch(`${BACKEND_URL}/${short_code}`, {
    redirect: "manual",
    cache: "no-store",
  });

  // If backend returned a redirect, follow it — click is already tracked
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (location) {
      redirect(location);
    }
  }

  // Determine error type
  const isExpired = response.status === 410;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">

        {/* Error Card */}
        <div className="bg-card border-4 border-border shadow-[8px_8px_0_0_rgba(0,0,0,1)] p-8 space-y-6">

          {/* Icon + Status */}
          <div className="flex items-start gap-4">
            <div
              className={`border-4 border-border p-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex-shrink-0 ${
                isExpired ? "bg-accent" : "bg-destructive"
              }`}
            >
              {isExpired ? (
                <Clock className="h-8 w-8 text-accent-foreground" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-destructive-foreground" />
              )}
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">
                {isExpired ? "410 Gone" : "404 Not Found"}
              </p>
              <h1 className="text-3xl font-black text-foreground leading-tight">
                {isExpired ? "LINK EXPIRED" : "LINK NOT FOUND"}
              </h1>
            </div>
          </div>

          {/* Short Code Badge */}
          <div className="bg-muted border-4 border-border p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            <p className="text-xs font-black uppercase text-muted-foreground mb-1">
              Short Code
            </p>
            <code className="text-xl font-black text-foreground font-mono">
              /{short_code}
            </code>
          </div>

          {/* Description */}
          <p className="font-bold text-muted-foreground leading-relaxed">
            {isExpired
              ? "This shortened URL has passed its expiry date and is no longer active. The original link cannot be accessed through this code."
              : "This short code does not exist or was never created. Double-check the URL and try again."}
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/"
              className="flex-1 bg-primary border-4 border-border p-3 text-center font-black text-primary-foreground uppercase tracking-wider hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center justify-center gap-2"
            >
              <Home className="h-5 w-5" />
              GO HOME
            </Link>
            <Link
              href="/?tab=retrieve"
              className="flex-1 bg-secondary border-4 border-border p-3 text-center font-black text-secondary-foreground uppercase tracking-wider hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center justify-center gap-2"
            >
              <Search className="h-5 w-5" />
              CHECK STATS
            </Link>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
          URL Shortener · Need help? Create a new short link from the homepage.
        </p>
      </div>
    </div>
  );
}
