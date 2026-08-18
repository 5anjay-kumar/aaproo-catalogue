"use client";

import { memo, useState } from "react";
import Image from "next/image";
import type { Product } from "@/lib/catalogue/types";
import { imageUrl } from "@/lib/catalogue/client";
import { DownloadIcon, ImageOffIcon } from "./icons";

const GRID_SIZES = "(min-width: 1280px) 260px, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw";

export const ProductCard = memo(function ProductCard({
  product,
  onOpen,
  onDownload,
  downloading,
  priority = false,
}: {
  product: Product;
  onOpen: (product: Product) => void;
  onDownload: (product: Product) => void;
  downloading: boolean;
  /** Set for the first few above-the-fold cards to skip lazy-loading and help LCP. */
  priority?: boolean;
}) {
  const cover = product.images[0];

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl2 border border-line bg-surface shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      {/* Image — the "display case" mat is the padded surface behind the photo */}
      <button
        onClick={() => onOpen(product)}
        className="relative block aspect-[4/5] w-full overflow-hidden bg-porcelain focus-ring"
        aria-label={`View ${product.name}`}
      >
        <ProductImage src={cover?.previewSrc} alt={product.name} priority={priority} />
        {product.images.length > 1 && (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-ink/75 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
            {product.images.length}
          </span>
        )}
        {product.availability?.toLowerCase().includes("out") && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-muted">
            Out of stock
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-2.5">
        <button onClick={() => onOpen(product)} className="text-left focus-ring rounded">
          <h3 className="line-clamp-1 text-[15px] font-semibold text-ink">{product.name}</h3>
          <p className="mt-0.5 line-clamp-1 text-[13px] text-muted">
            {[product.sku, product.category].filter(Boolean).join(" · ")}
          </p>
        </button>

        <button
          onClick={() => onDownload(product)}
          disabled={downloading || !cover}
          className="mt-3 inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-line bg-porcelain text-sm font-medium text-ink transition hover:border-ink hover:bg-ink hover:text-white focus-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <DownloadIcon width={16} height={16} />
          {downloading ? "Saving…" : "Download"}
        </button>
      </div>
    </article>
  );
});

export function ProductImage({
  src,
  alt,
  sizes = GRID_SIZES,
  priority = false,
}: {
  src?: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
}) {
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    return (
      <div className="flex h-full w-full items-center justify-center text-line">
        <ImageOffIcon width={40} height={40} />
      </div>
    );
  }

  return (
    // Routed through Next's built-in image optimizer: resized to the size actually
    // displayed and re-encoded as WebP/AVIF, instead of shipping the original
    // full-resolution file from Airtable on every view.
    <Image
      src={imageUrl(src)}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setBroken(true)}
      // object-contain, not object-cover — real product photos here vary widely in
      // aspect ratio (portrait to landscape) and often have pricing/branding baked
      // into the photo itself, so cropping to fill the tile can clip that content.
      // The porcelain background acts as a neutral mat for any letterboxed space.
      className="object-contain transition duration-300 group-hover:scale-[1.03]"
    />
  );
}
