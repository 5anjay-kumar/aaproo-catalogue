"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Catalogue as CatalogueData, Product } from "@/lib/catalogue/types";
import { downloadImage } from "@/lib/catalogue/client";
import { productFileBaseName } from "@/lib/catalogue/filenames";
import { ALL_CATEGORIES, normalizeLabel, UNCATEGORISED } from "@/lib/catalogue/category";
import { track, incrementProfile, registerSuperProperties } from "@/lib/mixpanel";
import { Header } from "./Header";
import { CategoryNav } from "./CategoryNav";
import { ProductCard } from "./ProductCard";
import { ProductModal } from "./ProductModal";
import { GridSkeleton } from "./Skeletons";
import { EmptyState, ErrorState } from "./States";
import { useToast } from "./Toast";

export function Catalogue({ initial }: { initial: CatalogueData | null }) {
  const toast = useToast();

  // `data === null` IS the failure state — there's no separate "loading" state
  // today since the initial fetch happens server-side before this component
  // ever mounts. Retrying re-enters that same null state until it resolves.
  const [data, setData] = useState<CatalogueData | null>(initial);
  const [retrying, setRetrying] = useState(false);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [sub, setSub] = useState<string | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const products = data?.products ?? [];
  const searching = query.trim().length > 0;

  // Tags every subsequent event with whether it happened on demo data, so a
  // misconfigured live integration can't silently mix fake usage into real data.
  useEffect(() => {
    if (data) registerSuperProperties({ is_demo: data.isDemo });
  }, [data]);

  // The very first load (server-side, before this component mounts) can fail
  // too — `initial` arrives as null in that case. Report it once on mount.
  useEffect(() => {
    if (initial === null) track("Catalogue Load Failed", { stage: "initial" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Precomputed once per product list (not per keystroke) — search just does a
  // cheap substring check against this instead of rebuilding + lowercasing every
  // product's searchable text on every character typed.
  const searchBlobs = useMemo(
    () =>
      new Map(
        products.map((p) => [
          p.id,
          [p.name, p.sku, p.category, p.subcategory].filter(Boolean).join(" ").toLowerCase(),
        ]),
      ),
    [products],
  );

  const filtered = useMemo(() => {
    if (searching) {
      const q = query.trim().toLowerCase();
      return products.filter((p) => searchBlobs.get(p.id)?.includes(q));
    }
    // Matches deriveCategories' bucketing exactly (trim before falling back to
    // UNCATEGORISED) so a whitespace-only category can't land in a different
    // bucket than the nav pill's count implies.
    const catKey = normalizeLabel(category);
    const activeSubKey = sub ? normalizeLabel(sub) : null;
    return products
      .filter((p) => category === ALL_CATEGORIES || normalizeLabel(p.category?.trim() || UNCATEGORISED) === catKey)
      .filter((p) => !activeSubKey || normalizeLabel(p.subcategory) === activeSubKey);
  }, [products, query, searching, category, sub, searchBlobs]);

  const selectCategory = useCallback((name: string) => {
    setCategory(name);
    setSub(null);
    setQuery("");
    if (name !== ALL_CATEGORIES) track("Category Selected", { category: name });
  }, []);

  const selectSub = useCallback(
    (name: string | null) => {
      setSub(name);
      if (name) track("Subcategory Selected", { category, subcategory: name });
    },
    [category],
  );

  // Debounced so typing doesn't fire an event per keystroke — only once the
  // user actually pauses on a search term.
  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const timer = setTimeout(() => {
      track("Search Performed", { query: q, result_count: filtered.length });
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const retry = useCallback(async () => {
    setRetrying(true);
    try {
      const res = await fetch("/api/products", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const fresh = (await res.json()) as CatalogueData;
      setData(fresh);
    } catch {
      setData(null);
      track("Catalogue Load Failed", { stage: "retry" });
    } finally {
      setRetrying(false);
    }
  }, []);

  const quickDownload = useCallback(
    async (product: Product) => {
      const cover = product.images[0];
      if (!cover) return;
      setDownloadingId(product.id);
      try {
        await downloadImage(cover.src, productFileBaseName(product));
        track("Image Downloaded", {
          source: "card",
          product_id: product.id,
          product_name: product.name,
          category: product.category,
        });
        incrementProfile({ "Images Downloaded": 1 });
        toast("Image downloaded");
      } catch {
        track("Image Download Failed", {
          source: "card",
          product_id: product.id,
          product_name: product.name,
          category: product.category,
        });
        toast("Couldn’t download image", "error");
      } finally {
        setDownloadingId(null);
      }
    },
    [toast],
  );

  const openProduct = useCallback((p: Product) => {
    setSelected(p);
    track("Product Viewed", {
      product_id: p.id,
      product_name: p.name,
      category: p.category,
      subcategory: p.subcategory,
      price: p.price,
    });
    incrementProfile({ "Products Viewed": 1 });
  }, []);
  const closeModal = useCallback(() => setSelected(null), []);

  // While searching, no single category is actually "selected" — search runs
  // across everything, so the nav shouldn't claim a category is active (and
  // subcategory pills, which would otherwise have no effect, simply don't show).
  const displayCategory = searching ? ALL_CATEGORIES : category;
  const displaySub = searching ? null : sub;

  return (
    <div className="min-h-dvh bg-porcelain">
      <Header query={query} onQuery={setQuery} demo={data?.isDemo ?? false} />

      {data && (
        <CategoryNav
          categories={data.categories}
          totalCount={products.length}
          activeCategory={displayCategory}
          activeSub={displaySub}
          onCategory={selectCategory}
          onSub={selectSub}
        />
      )}

      <main className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-7">
        {data ? (
          <>
            <div className="mb-4 flex items-baseline justify-between">
              <p className="text-sm text-muted">
                <span className="font-semibold text-ink">{filtered.length}</span>{" "}
                {filtered.length === 1 ? "product" : "products"}
                {searching && <span> for “{query.trim()}”</span>}
              </p>
            </div>

            {filtered.length === 0 ? (
              <EmptyState query={query.trim()} />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {filtered.map((p, i) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onOpen={openProduct}
                    onDownload={quickDownload}
                    downloading={downloadingId === p.id}
                    priority={i < 4}
                  />
                ))}
              </div>
            )}
          </>
        ) : retrying ? (
          <GridSkeleton />
        ) : (
          <ErrorState onRetry={retry} retrying={retrying} />
        )}
      </main>

      {selected && <ProductModal product={selected} onClose={closeModal} />}
    </div>
  );
}
