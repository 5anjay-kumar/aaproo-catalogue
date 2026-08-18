import type { Product } from "./types";

/**
 * Shared by both server routes (image proxy, zip download) and client code
 * (single-image download), so filenames are consistent no matter which path
 * produced them.
 */

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
};

function normalizeContentType(contentType: string): string {
  return contentType.split(";")[0].trim().toLowerCase();
}

/** Maps an image MIME type to a file extension, or "" if unrecognized. */
export function extensionForContentType(contentType: string): string {
  return EXTENSION_BY_CONTENT_TYPE[normalizeContentType(contentType)] ?? "";
}

/**
 * Restricts what an upstream response is allowed to actually be. Both the image
 * proxy and the zip download fetch from the same untrusted OrderMS/Airtable-
 * controlled URLs — without this, a non-raster type (e.g. SVG, which can carry
 * a <script>) could be served back to the browser (image proxy) or bundled into
 * a downloaded zip as if it were trusted content.
 */
export function isAllowedImageContentType(contentType: string): boolean {
  return normalizeContentType(contentType) in EXTENSION_BY_CONTENT_TYPE;
}

/** Turns arbitrary text into a safe, consistent filename fragment. */
export function sanitizeFilename(name: string, fallback = "aaproo"): string {
  const cleaned = name
    .replace(/[^a-z0-9-_ ]/gi, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
  return cleaned || fallback;
}

/** The name to base a downloaded file on for a given product. */
export function productFileBaseName(product: Pick<Product, "sku" | "name">): string {
  return (product.sku || product.name || "product").trim();
}
