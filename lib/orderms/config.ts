import "server-only";

/**
 * Central OrderMS configuration. Everything OrderMS-specific that might differ
 * between accounts or API versions is read from environment variables here, so
 * there are no OrderMS assumptions scattered through the codebase.
 *
 * ── What you must set for LIVE data (see .env.example) ────────────────────────
 *   ORDERMS_API_BASE_URL   Base URL of your OrderMS API (e.g. https://api.orderms.xyz/v1)
 *   ORDERMS_API_KEY        Your secret API key (server-only, never sent to the browser)
 *
 * ── Optional overrides (sensible defaults provided; CONFIRM against your docs) ─
 *   ORDERMS_PRODUCTS_PATH      default: /products
 *   ORDERMS_API_KEY_HEADER     default: Authorization
 *   ORDERMS_API_KEY_PREFIX     default: "Bearer "   (use "" for a bare key header like X-API-Key)
 *   ORDERMS_IMAGE_HOSTS        extra comma-separated hostnames the image proxy may fetch from
 *
 * When ORDERMS_API_BASE_URL is empty, the app runs on built-in demo data so it
 * is fully usable and deployable before the API is wired up.
 */

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() !== "" ? v.trim() : undefined;
}

/** Parses a non-negative integer env var, falling back (and never NaN) on anything invalid. */
function envSeconds(name: string, fallback: number): number {
  const raw = env(name);
  if (raw === undefined) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export const ordermsConfig = {
  baseUrl: env("ORDERMS_API_BASE_URL"),
  apiKey: env("ORDERMS_API_KEY"),

  productsPath: env("ORDERMS_PRODUCTS_PATH") ?? "/products",

  apiKeyHeader: env("ORDERMS_API_KEY_HEADER") ?? "Authorization",
  apiKeyPrefix: process.env.ORDERMS_API_KEY_PREFIX ?? "Bearer ",

  extraImageHosts: (env("ORDERMS_IMAGE_HOSTS") ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean),

  /** How long (seconds) to cache OrderMS responses on the server. */
  revalidateSeconds: envSeconds("ORDERMS_CACHE_SECONDS", 300),

  /**
   * How long (seconds) to cache fetched image bytes. Longer than the product-data
   * cache by default, since photos change far less often than price/stock and are
   * the most expensive thing to keep re-fetching.
   */
  imageCacheSeconds: envSeconds("ORDERMS_IMAGE_CACHE_SECONDS", 86400),
} as const;

let warnedPartialConfig = false;

/** True when a real OrderMS integration is configured. */
export function isLive(): boolean {
  const hasBase = Boolean(ordermsConfig.baseUrl);
  const hasKey = Boolean(ordermsConfig.apiKey);
  if (hasBase !== hasKey && !warnedPartialConfig) {
    warnedPartialConfig = true;
    console.error(
      "[orderms] Only one of ORDERMS_API_BASE_URL / ORDERMS_API_KEY is set — both are " +
        "required for live data. Falling back to demo data until both are configured.",
    );
  }
  return hasBase && hasKey;
}

/**
 * Hostnames the image proxy is allowed to fetch from. This prevents the proxy
 * from being abused as an open relay (SSRF protection).
 *
 * Memoized — every input (env vars, live/demo mode) is fixed for the life of the
 * process, so there's no reason to re-parse the env var and rebuild the Set on
 * every single image in a request (e.g. every file in a zip download).
 */
let cachedImageHosts: string[] | undefined;

export function allowedImageHosts(): string[] {
  if (cachedImageHosts) return cachedImageHosts;

  const hosts = new Set<string>(ordermsConfig.extraImageHosts);
  if (ordermsConfig.baseUrl) {
    try {
      hosts.add(new URL(ordermsConfig.baseUrl).hostname.toLowerCase());
    } catch {
      /* ignore malformed base url */
    }
  }
  if (!isLive()) {
    // Demo mode uses picsum.photos placeholder imagery.
    hosts.add("picsum.photos");
    hosts.add("fastly.picsum.photos");
  }
  cachedImageHosts = [...hosts];
  return cachedImageHosts;
}

/**
 * Airtable serves attachments from a varying subdomain (v1, v5, ...) of
 * airtableusercontent.com, so those hosts are allowed by suffix rather than
 * needing every subdomain listed explicitly.
 */
const AIRTABLE_IMAGE_SUFFIX = ".airtableusercontent.com";

export function isAllowedImageHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "airtableusercontent.com" || h.endsWith(AIRTABLE_IMAGE_SUFFIX)) return true;
  return allowedImageHosts().includes(h);
}

/**
 * Validates that `src` is an http(s) URL on an allowed host — the one check
 * both the image proxy and the zip download need before ever fetching a
 * OrderMS/Airtable-supplied URL. Returns the lowercased hostname if valid.
 */
export function resolveAllowedImageUrl(src: string): string | undefined {
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return undefined;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;
  const host = url.hostname.toLowerCase();
  return isAllowedImageHost(host) ? host : undefined;
}
