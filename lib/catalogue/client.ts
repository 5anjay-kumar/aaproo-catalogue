import type { Product } from "./types";
import { extensionForContentType, productFileBaseName, sanitizeFilename } from "./filenames";

/** Same-origin URL for displaying an OrderMS image (goes through our proxy). */
export function imageUrl(src: string): string {
  return `/api/image?${new URLSearchParams({ src })}`;
}

/** Same-origin URL that forces a download of a single image. */
export function downloadUrl(src: string, name: string): string {
  return `/api/image?${new URLSearchParams({ src, download: "1", name })}`;
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a tick before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Download a single image. Fetches through the same-origin proxy as a blob so we
 * can confirm success (for the toast) and handle failures gracefully.
 */
export async function downloadImage(src: string, name: string): Promise<void> {
  const res = await fetch(downloadUrl(src, name));
  if (!res.ok) throw new Error("download-failed");
  const blob = await res.blob();
  const safeName = sanitizeFilename(name, "aaproo-image");
  saveBlob(blob, `${safeName}${extensionForContentType(blob.type)}`);
}

/**
 * Download every image of a product as a single .zip. Returns how many images
 * actually made it into the zip — the server skips (rather than fails on) any
 * single image that couldn't be fetched, so this can be less than the product's
 * total image count.
 */
export async function downloadAllImages(product: Product): Promise<number> {
  const res = await fetch(`/api/download-zip?id=${encodeURIComponent(product.id)}`);
  if (!res.ok) throw new Error("zip-failed");
  const included = Number(res.headers.get("X-Images-Included")) || 0;
  const blob = await res.blob();
  const base = sanitizeFilename(productFileBaseName(product), "product");
  saveBlob(blob, `${base}-images.zip`);
  return included;
}

export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Fallback for older / non-secure contexts.
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  const copied = document.execCommand("copy");
  ta.remove();
  if (!copied) throw new Error("copy-failed");
}

/** A ready-to-paste block of product info for social posts / messages. */
export function productDetailsText(p: Product): string {
  const lines = [`Product: ${p.name}`];
  if (p.sku) lines.push(`SKU: ${p.sku}`);
  if (p.category) lines.push(`Category: ${p.category}`);
  if (p.subcategory) lines.push(`Subcategory: ${p.subcategory}`);
  if (p.price) lines.push(`Price: ${p.price}`);
  return lines.join("\n");
}
