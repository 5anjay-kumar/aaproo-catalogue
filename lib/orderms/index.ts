import "server-only";
import { cache } from "react";
import type { Catalogue, Category, Product, Subcategory } from "@/lib/catalogue/types";
import { normalizeLabel, UNCATEGORISED } from "@/lib/catalogue/category";
import { isLive, ordermsConfig } from "./config";
import { ordermsGet } from "./client";
import { toProducts } from "./adapter";
import { mockProducts } from "./mock";

/**
 * Public server-side entry point for catalogue data. The rest of the app calls
 * only this function — it never talks to OrderMS directly. Returns fully-mapped
 * domain objects that are safe to serialize to the browser (no secrets).
 *
 * Wrapped in React's `cache()` so multiple calls within the same request (e.g.
 * a route handler that also needs a single product) reuse one fetch + mapping
 * pass instead of redoing it each time.
 */
export const getCatalogue = cache(async (): Promise<Catalogue> => {
  const products = isLive() ? await fetchLiveProducts() : mockProducts();
  const categories = deriveCategories(products);
  return { products, categories, isDemo: !isLive() };
});

/** Look up a single product by id, reusing the same cached catalogue fetch. */
export async function getProduct(id: string): Promise<Product | undefined> {
  const { products } = await getCatalogue();
  return products.find((p) => p.id === id);
}

/**
 * Airtable returns at most 100 records per page, plus an "offset" when more
 * pages remain. Follow it until Airtable stops returning one, then map the
 * full concatenated record set.
 *
 * Capped at MAX_PAGES as a safety net — a misbehaving/corrupted upstream that
 * keeps returning a non-empty offset would otherwise loop and accumulate
 * records indefinitely instead of failing gracefully.
 */
const MAX_PAGES = 200; // 200 * 100 records/page = 20,000 products ceiling

async function fetchLiveProducts(): Promise<Product[]> {
  const records: unknown[] = [];
  let offset: string | undefined;
  let page = 0;

  do {
    const path = offset
      ? `${ordermsConfig.productsPath}?offset=${encodeURIComponent(offset)}`
      : ordermsConfig.productsPath;
    // Tagged "products" so app/api/revalidate/route.ts can bust this exact
    // cache entry on demand instead of waiting out ORDERMS_CACHE_SECONDS.
    const result = await ordermsGet<{ records?: unknown[]; offset?: string }>(path, {
      tags: ["products"],
    });
    records.push(...(result.records ?? []));
    offset = result.offset;
    page += 1;
    if (page >= MAX_PAGES && offset) {
      console.error(`[orderms] hit MAX_PAGES (${MAX_PAGES}) while paginating; stopping early.`);
      break;
    }
  } while (offset);

  return toProducts({ records });
}

/**
 * Categories and subcategories are derived from the products themselves in a
 * single pass, so they are always dynamic, always OrderMS-sourced, and their
 * counts always match what the user can actually see. (No hardcoded category
 * list.) Grouping is keyed by a normalized (trimmed, case-folded) label so
 * minor data-entry drift like "Rings" vs "rings" doesn't split into two
 * categories — the first-seen casing is kept as the display name.
 */
function deriveCategories(products: Product[]): Category[] {
  type Group = { name: string; count: number; subs: Map<string, { name: string; count: number }> };
  const groups = new Map<string, Group>();

  for (const p of products) {
    const catName = p.category?.trim() || UNCATEGORISED;
    const catKey = normalizeLabel(catName);
    if (!groups.has(catKey)) groups.set(catKey, { name: catName, count: 0, subs: new Map() });
    const group = groups.get(catKey)!;
    group.count += 1;

    if (p.subcategory) {
      const subKey = normalizeLabel(p.subcategory);
      if (!group.subs.has(subKey)) group.subs.set(subKey, { name: p.subcategory, count: 0 });
      group.subs.get(subKey)!.count += 1;
    }
  }

  const categories: Category[] = [...groups.values()].map((g) => ({
    name: g.name,
    count: g.count,
    subcategories: ([...g.subs.values()] as Subcategory[]).sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
  }));

  return categories.sort((a, b) => a.name.localeCompare(b.name));
}
