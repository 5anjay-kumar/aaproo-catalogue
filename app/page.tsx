import { Catalogue } from "@/components/Catalogue";
import { getCatalogue } from "@/lib/orderms";
import type { Catalogue as CatalogueData } from "@/lib/catalogue/types";

// Let Next.js cache and serve this page statically, revalidating in the background
// on the same cadence as the OrderMS fetch (ORDERMS_CACHE_SECONDS, see lib/orderms/config.ts).
// This means most visitors get an instant cached response instead of waiting on a
// live OrderMS round trip on every single page load.

export default async function Page() {
  let initial: CatalogueData | null = null;
  try {
    initial = await getCatalogue();
  } catch {
    // Fall through: the client renders a friendly error + retry. No details leak.
    initial = null;
  }

  return <Catalogue initial={initial} />;
}
