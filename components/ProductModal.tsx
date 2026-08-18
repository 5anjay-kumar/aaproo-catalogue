"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Product } from "@/lib/catalogue/types";
import {
  imageUrl,
  downloadImage,
  downloadAllImages,
  copyText,
  productDetailsText,
} from "@/lib/catalogue/client";
import { productFileBaseName } from "@/lib/catalogue/filenames";
import { track, incrementProfile } from "@/lib/mixpanel";
import { useToast } from "./Toast";
import { ProductImage } from "./ProductCard";
import {
  CloseIcon,
  DownloadIcon,
  CopyIcon,
  ChevronLeft,
  ChevronRight,
} from "./icons";

export function ProductModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const toast = useToast();
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState<null | "one" | "all">(null);

  const images = product.images;
  const hasImages = images.length > 0;
  const many = images.length > 1;

  // Esc to close + lock background scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // Don't hijack arrow keys while the user is typing somewhere else on the
      // page (e.g. the search box, which stays mounted behind the modal).
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (isTyping) return;

      if (e.key === "ArrowRight" && many) setActive((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft" && many) setActive((i) => (i - 1 + images.length) % images.length);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, many, images.length]);

  const fileName = productFileBaseName(product);

  async function handleDownloadOne() {
    if (!hasImages) return;
    setBusy("one");
    try {
      const suffix = many ? `-${active + 1}` : "";
      await downloadImage(images[active].src, `${fileName}${suffix}`);
      track("Image Downloaded", {
        source: "modal",
        product_id: product.id,
        product_name: product.name,
        category: product.category,
      });
      incrementProfile({ "Images Downloaded": 1 });
      toast("Image downloaded");
    } catch {
      track("Image Download Failed", {
        source: "modal",
        product_id: product.id,
        product_name: product.name,
        category: product.category,
      });
      toast("Couldn’t download image", "error");
    } finally {
      setBusy(null);
    }
  }

  async function handleDownloadAll() {
    setBusy("all");
    try {
      const included = await downloadAllImages(product);
      track("Zip Downloaded", {
        product_id: product.id,
        product_name: product.name,
        category: product.category,
        images_included: included,
        images_total: images.length,
      });
      incrementProfile({ "Zips Downloaded": 1 });
      toast(
        included === images.length
          ? `${included} images downloaded`
          : `${included} of ${images.length} images downloaded`,
      );
    } catch {
      track("Zip Download Failed", {
        product_id: product.id,
        product_name: product.name,
        category: product.category,
      });
      toast("Couldn’t download images", "error");
    } finally {
      setBusy(null);
    }
  }

  async function handleCopy(text: string, label: string) {
    try {
      await copyText(text);
      track("Copied Product Info", {
        field: label.toLowerCase(),
        product_id: product.id,
        product_name: product.name,
      });
      toast(`${label} copied`);
    } catch {
      track("Copy Failed", {
        field: label.toLowerCase(),
        product_id: product.id,
        product_name: product.name,
      });
      toast("Couldn’t copy", "error");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
    >
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-surface shadow-sheet animate-sheet-up sm:max-w-4xl sm:rounded-2xl sm:shadow-lift sm:animate-scale-in">
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-2.5 sm:hidden">
          <span className="h-1 w-10 rounded-full bg-line" />
        </div>

        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-surface/80 text-ink shadow-sm backdrop-blur transition hover:bg-porcelain focus-ring"
        >
          <CloseIcon width={18} height={18} />
        </button>

        <div className="grid gap-0 overflow-y-auto sm:grid-cols-2">
          {/* Gallery */}
          <div className="bg-porcelain p-4 sm:p-6">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-porcelain">
              <div className="group h-full w-full">
                <ProductImage
                  src={images[active]?.previewSrc}
                  alt={product.name}
                  sizes="(min-width: 640px) 400px, 100vw"
                  priority
                />
              </div>
              {many && (
                <>
                  <GalleryArrow
                    side="left"
                    onClick={() => setActive((i) => (i - 1 + images.length) % images.length)}
                  />
                  <GalleryArrow
                    side="right"
                    onClick={() => setActive((i) => (i + 1) % images.length)}
                  />
                </>
              )}
            </div>

            {many && (
              <div className="scroll-row mt-3 flex gap-2 overflow-x-auto">
                {images.map((im, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    aria-label={`Image ${i + 1}`}
                    aria-current={i === active}
                    className={`relative h-16 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition focus-ring ${
                      i === active ? "border-accent" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image src={imageUrl(im.previewSrc)} alt="" fill sizes="56px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col p-5 sm:p-6">
            {product.category && (
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
                {[product.category, product.subcategory].filter(Boolean).join(" / ")}
              </p>
            )}
            <h2 className="mt-1.5 font-display text-2xl leading-tight text-ink sm:text-[26px]">
              {product.name}
            </h2>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              {product.sku && <span className="text-muted">SKU {product.sku}</span>}
              {product.price && <span className="font-semibold text-ink">{product.price}</span>}
              {product.availability && (
                <span className="text-muted">{product.availability}</span>
              )}
            </div>

            {product.description && (
              <p className="mt-4 text-[14px] leading-relaxed text-ink/80">
                {product.description}
              </p>
            )}

            {product.attributes.length > 0 && (
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {product.attributes.map((a) => (
                  <div key={a.label} className="min-w-0">
                    <dt className="text-[12px] uppercase tracking-wide text-muted">{a.label}</dt>
                    <dd className="truncate text-ink">{a.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {/* Actions */}
            <div className="mt-auto space-y-2.5 pt-6">
              <button
                onClick={handleDownloadOne}
                disabled={!hasImages || busy !== null}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink text-[15px] font-semibold text-white transition hover:opacity-90 focus-ring disabled:opacity-50"
              >
                <DownloadIcon width={18} height={18} />
                {busy === "one" ? "Saving…" : "Download image"}
              </button>

              {many && (
                <button
                  onClick={handleDownloadAll}
                  disabled={busy !== null}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface text-sm font-medium text-ink transition hover:border-ink focus-ring disabled:opacity-50"
                >
                  <DownloadIcon width={16} height={16} />
                  {busy === "all" ? "Zipping…" : `Download all ${images.length} images`}
                </button>
              )}

              <div className="flex gap-2.5">
                <button
                  onClick={() => handleCopy(product.name, "Name")}
                  className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-line text-[13px] font-medium text-ink transition hover:bg-porcelain focus-ring"
                >
                  <CopyIcon width={15} height={15} />
                  Copy name
                </button>
                <button
                  onClick={() => handleCopy(productDetailsText(product), "Details")}
                  className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl border border-line text-[13px] font-medium text-ink transition hover:bg-porcelain focus-ring"
                >
                  <CopyIcon width={15} height={15} />
                  Copy details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GalleryArrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onClick}
      aria-label={side === "left" ? "Previous image" : "Next image"}
      className={`absolute top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-surface/85 text-ink shadow-sm backdrop-blur transition hover:bg-surface focus-ring ${
        side === "left" ? "left-2.5" : "right-2.5"
      }`}
    >
      <Icon width={18} height={18} />
    </button>
  );
}
