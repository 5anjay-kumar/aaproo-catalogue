import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { getProduct } from "@/lib/orderms";
import { ordermsFetchImage } from "@/lib/orderms/client";
import { resolveAllowedImageUrl } from "@/lib/orderms/config";
import {
  extensionForContentType,
  isAllowedImageContentType,
  productFileBaseName,
  sanitizeFilename,
} from "@/lib/catalogue/filenames";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Bundles every image of a single product into one .zip, fetched server-side so
 * authenticated image URLs work and no credentials reach the browser.
 *
 *   GET /api/download-zip?id=<productId>
 *
 * Image URLs are resolved from the product on the server (not trusted from the
 * client), but the source of those URLs (the connected OrderMS/Airtable backend)
 * is itself untrusted content, so each one still goes through the same host
 * allow-list + content-type check the /api/image proxy enforces before being
 * fetched and bundled.
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing product." }, { status: 400 });

  let product;
  try {
    product = await getProduct(id);
  } catch {
    return NextResponse.json({ error: "Unable to load product." }, { status: 502 });
  }

  if (!product || product.images.length === 0) {
    return NextResponse.json({ error: "No images for this product." }, { status: 404 });
  }

  const zip = new JSZip();
  const base = sanitizeFilename(productFileBaseName(product), "product");
  let added = 0;

  await Promise.all(
    product.images.map(async (image, i) => {
      if (!resolveAllowedImageUrl(image.src)) {
        console.error(`[download-zip] rejected disallowed image host: ${image.src}`);
        return;
      }
      try {
        const { body, contentType } = await ordermsFetchImage(image.src);
        if (!isAllowedImageContentType(contentType)) {
          console.error(`[download-zip] rejected unsupported content-type: ${contentType}`);
          return;
        }
        zip.file(`${base}-${i + 1}${extensionForContentType(contentType)}`, body);
        added += 1;
      } catch (err) {
        // Skip an image that fails; still return the rest.
        console.error(`[download-zip] image fetch failed for product ${id}:`, err);
      }
    }),
  );

  if (added === 0) {
    return NextResponse.json({ error: "Images unavailable." }, { status: 502 });
  }

  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${base}-images.zip"`,
      "Cache-Control": "no-store",
      // Lets the client report an accurate count when some images failed to fetch.
      "X-Images-Included": String(added),
    },
  });
}
