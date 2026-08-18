import { NextRequest, NextResponse } from "next/server";
import { ordermsConfig, resolveAllowedImageUrl } from "@/lib/orderms/config";
import { ordermsFetchImage } from "@/lib/orderms/client";
import { extensionForContentType, isAllowedImageContentType, sanitizeFilename } from "@/lib/catalogue/filenames";

export const runtime = "nodejs";

/**
 * Same-origin image proxy. It exists so that:
 *   • authenticated / signed OrderMS image URLs work without exposing credentials
 *   • CORS is never an issue (the browser only ever talks to our own origin)
 *   • downloads can be forced with Content-Disposition
 *
 * SSRF protection: only http(s) URLs on hostnames in the allow-list may be fetched.
 * Content-type is restricted to actual raster image types — this is served
 * same-origin, so passing through arbitrary upstream types (e.g. SVG, which
 * can carry a <script>) would let attacker-controlled content execute as if
 * it were this app's own origin.
 *
 *   GET /api/image?src=<encoded url>[&download=1][&name=filename]
 */
export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get("src");
  const download = req.nextUrl.searchParams.get("download") === "1";
  const name = req.nextUrl.searchParams.get("name") ?? "aaproo-image";

  if (!src) {
    return NextResponse.json({ error: "Missing image." }, { status: 400 });
  }

  if (!resolveAllowedImageUrl(src)) {
    // Never proxy an arbitrary or disallowed host.
    return NextResponse.json({ error: "Image host not allowed." }, { status: 400 });
  }

  try {
    const { body, contentType } = await ordermsFetchImage(src);
    if (!isAllowedImageContentType(contentType)) {
      return NextResponse.json({ error: "Unsupported image type." }, { status: 502 });
    }

    const ext = extensionForContentType(contentType);
    const filename = `${sanitizeFilename(name, "aaproo-image")}${ext}`;

    const headers = new Headers({
      "Content-Type": contentType,
      "Content-Length": String(body.byteLength),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": download
        ? "no-store"
        : `public, max-age=${ordermsConfig.imageCacheSeconds}, stale-while-revalidate=${ordermsConfig.imageCacheSeconds * 7}`,
    });
    if (download) {
      headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    }
    return new NextResponse(body, { status: 200, headers });
  } catch {
    return NextResponse.json({ error: "Image unavailable." }, { status: 502 });
  }
}
