"use client";

import Image from "next/image";
import { SearchIcon, CloseIcon } from "./icons";

export function Header({
  query,
  onQuery,
  demo,
}: {
  query: string;
  onQuery: (v: string) => void;
  demo: boolean;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-porcelain/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-6 sm:px-6 sm:py-4">
        <div className="relative flex items-center justify-center">
          <a href="/" className="group flex items-center gap-2" aria-label="Aaproo catalogue home">
            <Image src="/logo.png" alt="Aaproo" width={110} height={32} priority className="h-8 w-auto" />
          </a>
          {demo && (
            <span className="absolute right-0 rounded-full border border-line bg-surface px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-muted sm:hidden">
              Demo data
            </span>
          )}
        </div>

        <div className="relative flex-1 sm:max-w-xl sm:mx-auto">
          <SearchIcon
            width={18}
            height={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            inputMode="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search products, SKU, category…"
            aria-label="Search products"
            className="h-11 w-full rounded-full border border-line bg-surface pl-11 pr-10 text-[15px] text-ink placeholder:text-muted shadow-sm outline-none transition focus:border-accent/50 focus:shadow-card"
          />
          {query && (
            <button
              onClick={() => onQuery("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted transition hover:bg-porcelain hover:text-ink focus-ring"
            >
              <CloseIcon width={16} height={16} />
            </button>
          )}
        </div>

        {demo && (
          <span className="hidden rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted sm:inline-block">
            Demo data
          </span>
        )}
      </div>
    </header>
  );
}
