// Centralised API base URL — reads from env var in production,
// falls back to local backend for development.
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default API_BASE_URL;
