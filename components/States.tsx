"use client";

import { SearchIcon } from "./icons";

export function ErrorState({ onRetry, retrying }: { onRetry: () => void; retrying?: boolean }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center py-24 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-line text-muted">
        <span className="font-display text-2xl">A</span>
      </div>
      <h2 className="text-lg font-semibold text-ink">Unable to load products</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Something went wrong while loading the catalogue. Check your connection and try again.
      </p>
      <button
        onClick={onRetry}
        disabled={retrying}
        className="mt-6 rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90 focus-ring disabled:opacity-60"
      >
        {retrying ? "Trying…" : "Try again"}
      </button>
    </div>
  );
}

export function EmptyState({ query }: { query: string }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center py-24 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-line text-muted">
        <SearchIcon width={22} height={22} />
      </div>
      <h2 className="text-lg font-semibold text-ink">No products found</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {query
          ? `Nothing matches “${query}”. Try a different name, SKU, or category.`
          : "There are no products in this category yet."}
      </p>
    </div>
  );
}
