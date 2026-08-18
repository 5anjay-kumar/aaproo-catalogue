/**
 * Domain model for the catalogue.
 *
 * This is the ONLY shape the UI ever sees. Raw OrderMS responses are translated
 * into these types inside `lib/orderms/adapter.ts`. If OrderMS changes its API,
 * only the adapter changes — components stay untouched.
 *
 * Nothing sensitive (API keys, tokens, raw auth URLs) may ever appear on these
 * types, because instances are serialized to the browser.
 */

export interface ProductImage {
  /** Absolute source URL of the full-resolution image — used for downloads. */
  src: string;
  /**
   * A smaller pre-generated variant for on-screen display (grid, modal, thumbnails).
   * Falls back to `src` when the source doesn't provide one. Full-resolution `src`
   * is reserved for actual downloads, where quality matters more than load time.
   */
  previewSrc: string;
  /** Optional alt text / caption. */
  alt?: string;
}

export interface ProductAttribute {
  label: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  subcategory?: string;
  description?: string;
  /** Human-ready price string, e.g. "Rs 2,400". Undefined when not available. */
  price?: string;
  images: ProductImage[];
  attributes: ProductAttribute[];
  /** e.g. "In stock", "Out of stock". Undefined when OrderMS doesn't provide it. */
  availability?: string;
}

export interface Subcategory {
  name: string;
  count: number;
}

export interface Category {
  name: string;
  count: number;
  subcategories: Subcategory[];
}

export interface Catalogue {
  products: Product[];
  categories: Category[];
  /** True when the app is running on built-in demo data (no OrderMS configured). */
  isDemo: boolean;
}
