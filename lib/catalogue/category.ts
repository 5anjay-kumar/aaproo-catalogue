/** Sentinel category name meaning "no category filter applied." */
export const ALL_CATEGORIES = "All Products";

/** Fallback display name for products with no category set. */
export const UNCATEGORISED = "Uncategorised";

/**
 * Case/whitespace-insensitive comparison key for a category or subcategory
 * label, so minor data-entry drift ("Rings" vs "rings") doesn't silently
 * split one category into two.
 */
export function normalizeLabel(value?: string): string {
  return (value ?? "").trim().toLowerCase();
}
