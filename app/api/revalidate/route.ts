import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

/**
 * On-demand revalidation, meant to be called by an Airtable Automation webhook
 * whenever the Products table changes. Busts the "products" Data Cache entry
 * (see lib/orderms/index.ts) so the next page view gets fresh data immediately,
 * instead of waiting out ORDERMS_CACHE_SECONDS (default 300s).
 *
 * No image-cache handling needed here: Airtable gives every uploaded attachment
 * a brand-new URL, so a freshly-added photo was never cached in the first place
 * and is inherently fresh on first request once the new products list is live.
 *
 *   POST /api/revalidate
 *   Header: x-revalidate-secret: <REVALIDATE_SECRET>
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-revalidate-secret");
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  revalidateTag("products");
  revalidatePath("/");

  return NextResponse.json({ revalidated: true, now: Date.now() });
}
