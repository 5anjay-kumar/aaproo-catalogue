import "server-only";
import type { Product, ProductImage, ProductAttribute } from "@/lib/catalogue/types";

/**
 * ┌───────────────────────────────────────────────────────────────────────────┐
 * │  Maps raw Airtable records into the domain Product type.                  │
 * │  Airtable record shape: { id: "recXXX", fields: { Name, Category, ... } } │
 * └───────────────────────────────────────────────────────────────────────────┘
 */

type Raw = Record<string, any>;

/** Airtable always nests records under a top-level "records" array. */
export function unwrapList(payload: any): Raw[] {
  return Array.isArray(payload?.records) ? payload.records : [];
}

function str(v: any): string | undefined {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s === "" ? undefined : s;
}

function isHttpUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/** fields.Price is a plain number in Airtable, e.g. 450 -> "Rs 450". */
function toPrice(fields: Raw): string | undefined {
  const price = fields.Price;
  if (typeof price !== "number" || Number.isNaN(price)) return undefined;
  return `Rs ${Math.round(price).toLocaleString("en-US")}`;
}

/**
 * fields.Images is a real Airtable attachment array:
 * [{ url, filename, thumbnails: { small, large, full }, ... }].
 *
 * `url` is the full-resolution original (reserved for downloads — quality matters
 * there). Airtable also pre-generates a smaller "large" thumbnail per attachment;
 * using that for on-screen display avoids fetching a multi-MB original through our
 * proxy just to show a ~200px grid tile.
 */
function toImages(fields: Raw): ProductImage[] {
  const list = fields.Images;
  if (!Array.isArray(list)) return [];
  const images: ProductImage[] = [];
  for (const item of list) {
    const src = str(item?.url);
    if (!src || !isHttpUrl(src)) continue;
    const thumb = str(item?.thumbnails?.large?.url);
    const previewSrc = thumb && isHttpUrl(thumb) ? thumb : src;
    images.push({ src, previewSrc });
  }
  return images;
}

/** fields.InStock is a boolean. */
function toAvailability(fields: Raw): string | undefined {
  if (typeof fields.InStock !== "boolean") return undefined;
  return fields.InStock ? "In stock" : "Out of stock";
}

/**
 * fields.Published is a boolean. Only an explicit `false` hides a product — quick
 * entries that only fill in Category/Subcategory/Image and never touch this field
 * still show up by default.
 */
function isPublished(fields: Raw): boolean {
  return fields.Published !== false;
}

/** Map one raw Airtable record into the domain model. */
export function toProduct(raw: Raw, index: number): Product | null {
  const fields: Raw = raw?.fields ?? {};
  if (!isPublished(fields)) return null;

  // Name is optional — a quick entry that's just Category/Subcategory/Image still
  // needs something to show as the title, so fall back to whatever identifies it.
  const name = str(fields.Name) ?? str(fields.SubCategory) ?? str(fields.Category);
  if (!name) return null; // Truly nothing to identify this record by.

  return {
    id: str(raw?.id) ?? `p-${index}`,
    name,
    sku: str(fields.SKU),
    category: str(fields.Category),
    subcategory: str(fields.SubCategory),
    price: toPrice(fields),
    images: toImages(fields),
    attributes: [] as ProductAttribute[],
    availability: toAvailability(fields),
  };
}

export function toProducts(payload: any): Product[] {
  return unwrapList(payload)
    .map((raw, i) => toProduct(raw, i))
    .filter((p): p is Product => p !== null);
}
