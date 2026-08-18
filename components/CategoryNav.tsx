"use client";

import type { Category } from "@/lib/catalogue/types";
import { ALL_CATEGORIES } from "@/lib/catalogue/category";

export function CategoryNav({
  categories,
  totalCount,
  activeCategory,
  activeSub,
  onCategory,
  onSub,
}: {
  categories: Category[];
  totalCount: number;
  activeCategory: string;
  activeSub: string | null;
  onCategory: (name: string) => void;
  onSub: (name: string | null) => void;
}) {
  const current = categories.find((c) => c.name === activeCategory);
  const subs = current?.subcategories ?? [];

  return (
    <nav aria-label="Product categories" className="border-b border-line bg-porcelain">
      <div className="mx-auto max-w-[1400px] px-4 py-3 sm:px-6">
        {/* Categories — wraps onto as many rows as needed so every category is
            visible up front, with nothing hidden behind a sideways scroll. */}
        <div className="flex flex-wrap gap-2">
          <Pill active={activeCategory === ALL_CATEGORIES} onClick={() => onCategory(ALL_CATEGORIES)}>
            All Products
            <Count>{totalCount}</Count>
          </Pill>
          {categories.map((c) => (
            <Pill key={c.name} active={activeCategory === c.name} onClick={() => onCategory(c.name)}>
              {c.name}
              <Count>{c.count}</Count>
            </Pill>
          ))}
        </div>

        {/* Subcategories (only when the active category has them) */}
        {subs.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-2 border-t border-line/70 pt-2.5">
            <Pill size="sm" active={activeSub === null} onClick={() => onSub(null)}>
              All {activeCategory}
            </Pill>
            {subs.map((s) => (
              <Pill key={s.name} size="sm" active={activeSub === s.name} onClick={() => onSub(s.name)}>
                {s.name}
              </Pill>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}

function Pill({
  active,
  onClick,
  size = "lg",
  children,
}: {
  active: boolean;
  onClick: () => void;
  size?: "lg" | "sm";
  children: React.ReactNode;
}) {
  const base = "inline-flex items-center whitespace-nowrap rounded-full transition focus-ring";
  const sizing =
    size === "lg"
      ? "min-h-[44px] gap-1.5 border-2 px-4 py-2.5 text-[15px] font-semibold"
      : "min-h-[40px] border px-3.5 py-2 text-sm font-medium";
  const tone =
    size === "lg"
      ? active
        ? "border-ink bg-ink text-white"
        : "border-line bg-surface text-ink hover:border-ink/40 active:border-ink/60"
      : active
        ? "border-accent bg-accent-soft text-accent"
        : "border-transparent text-muted hover:bg-surface hover:text-ink";

  return (
    <button onClick={onClick} aria-pressed={active} className={`${base} ${sizing} ${tone}`}>
      {children}
    </button>
  );
}

function Count({ children }: { children: React.ReactNode }) {
  return <span className="text-[13px] font-normal opacity-70">{children}</span>;
}
