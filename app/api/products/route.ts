import { NextResponse } from "next/server";
import { getCatalogue } from "@/lib/orderms";

// Node runtime: this route reads server-only OrderMS modules.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Returns the fully-mapped catalogue (products + categories). Used by the client
 * for the "Try again" retry flow. The response contains only domain objects —
 * never the API key or raw OrderMS payloads.
 */
export async function GET() {
  try {
    const catalogue = await getCatalogue();
    return NextResponse.json(catalogue, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load products." },
      { status: 502 },
    );
  }
}
