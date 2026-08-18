import "server-only";
import { ordermsConfig } from "./config";

/**
 * Low-level OrderMS HTTP client. This module is the ONLY place the API key is
 * read and attached. It is marked `server-only`, so importing it from any client
 * component is a build error — the key can never leak into the browser bundle.
 */

// Bounds how long a single upstream request can hang before we give up — without
// this, a stalled OrderMS/image host ties up the request indefinitely instead of
// failing like a normal network error would.
const FETCH_TIMEOUT_MS = 10_000;

export class OrderMsError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "OrderMsError";
  }
}

function authHeaders(): Record<string, string> {
  const { apiKey, apiKeyHeader, apiKeyPrefix } = ordermsConfig;
  if (!apiKey) return {};
  return { [apiKeyHeader]: `${apiKeyPrefix}${apiKey}` };
}

function buildUrl(path: string): string {
  if (!ordermsConfig.baseUrl) {
    throw new OrderMsError("OrderMS is not configured (missing ORDERMS_API_BASE_URL).");
  }
  const base = ordermsConfig.baseUrl.replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

/**
 * GET a JSON resource from OrderMS. Errors are normalized to OrderMsError and
 * NEVER include the API key or raw auth headers.
 *
 * `tags` let a caller opt this specific fetch into on-demand revalidation (see
 * app/api/revalidate/route.ts) — left optional so this generic client doesn't
 * need to know about any particular domain's cache-tag naming.
 */
export async function ordermsGet<T = unknown>(path: string, opts?: { tags?: string[] }): Promise<T> {
  const url = buildUrl(path);
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: "application/json", ...authHeaders() },
      // Server-side cache so we don't hammer OrderMS on every page view.
      next: { revalidate: ordermsConfig.revalidateSeconds, tags: opts?.tags },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (err) {
    console.error(`[orderms] GET ${path} failed to reach OrderMS:`, err);
    throw new OrderMsError("Could not reach OrderMS.");
  }

  if (!res.ok) {
    // Log detail server-side only; surface a generic message.
    console.error(`[orderms] GET ${path} -> ${res.status}`);
    throw new OrderMsError(`OrderMS returned an error.`, res.status);
  }

  try {
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[orderms] GET ${path} returned unreadable JSON:`, err);
    throw new OrderMsError("OrderMS returned an unreadable response.");
  }
}

/**
 * Fetch a raw image from OrderMS (or its image host) with auth attached when the
 * host is the OrderMS API itself. Returns the raw bytes + content type. Used by
 * the image proxy so authenticated/signed image URLs work without exposing the key.
 */
export async function ordermsFetchImage(
  src: string,
): Promise<{ body: ArrayBuffer; contentType: string }> {
  const withAuth = isOrdermsHost(src);
  let res: Response;
  try {
    res = await fetch(src, {
      headers: withAuth ? authHeaders() : {},
      next: { revalidate: ordermsConfig.imageCacheSeconds },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (err) {
    console.error(`[orderms] failed to reach image host for ${src}:`, err);
    throw new OrderMsError("Could not fetch the image.");
  }
  if (!res.ok) {
    console.error(`[orderms] image ${res.status}`);
    throw new OrderMsError("Image is unavailable.", res.status);
  }
  const contentType = res.headers.get("content-type") ?? "application/octet-stream";
  const body = await res.arrayBuffer();
  return { body, contentType };
}

function isOrdermsHost(src: string): boolean {
  if (!ordermsConfig.baseUrl) return false;
  try {
    return new URL(src).hostname === new URL(ordermsConfig.baseUrl).hostname;
  } catch {
    return false;
  }
}
