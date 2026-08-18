import "server-only";
import type { Product } from "@/lib/catalogue/types";

/**
 * Built-in demo catalogue. Used automatically whenever OrderMS is not configured
 * (no ORDERMS_API_BASE_URL), so the app is fully usable and deployable before the
 * API is connected. Once live data is wired up, this file is never touched.
 *
 * Images use picsum.photos seeded placeholders so they load reliably in a demo.
 */

const img = (seed: string, n = 1): { src: string; previewSrc: string }[] =>
  Array.from({ length: n }, (_, i) => ({
    src: `https://picsum.photos/seed/aaproo-${seed}-${i}/900/1125`,
    previewSrc: `https://picsum.photos/seed/aaproo-${seed}-${i}/450/563`,
  }));

type Seed = Omit<Product, "images" | "attributes"> & {
  images: { src: string; previewSrc: string }[];
  attributes?: { label: string; value: string }[];
};

const seeds: Seed[] = [
  // ── Jewelry ────────────────────────────────────────────────────────────────
  { id: "ar-101", name: "Gold Antique Ring", sku: "AR-101", category: "Jewelry", subcategory: "Rings", price: "Rs 1,850", availability: "In stock", description: "Hand-finished antique-gold ring with a filigree band.", images: img("ring1", 3), attributes: [{ label: "Metal", value: "Gold plated" }, { label: "Adjustable", value: "Yes" }] },
  { id: "ar-102", name: "Emerald Solitaire Ring", sku: "AR-102", category: "Jewelry", subcategory: "Rings", price: "Rs 2,200", availability: "In stock", description: "Single emerald-cut stone on a slim polished band.", images: img("ring2", 2) },
  { id: "nk-201", name: "Layered Pearl Necklace", sku: "NK-201", category: "Jewelry", subcategory: "Necklaces", price: "Rs 3,400", availability: "In stock", description: "Two-strand freshwater-style pearls with a gold clasp.", images: img("neck1", 3), attributes: [{ label: "Length", value: "16 + 18 in" }] },
  { id: "nk-202", name: "Kundan Choker Set", sku: "NK-202", category: "Jewelry", subcategory: "Necklaces", price: "Rs 5,900", availability: "Low stock", description: "Bridal kundan choker with matching drop earrings.", images: img("neck2", 2) },
  { id: "br-301", name: "Rose Gold Cuff Bracelet", sku: "BR-301", category: "Jewelry", subcategory: "Bracelets", price: "Rs 1,600", availability: "In stock", images: img("brac1", 2) },
  { id: "br-302", name: "Beaded Charm Bracelet", sku: "BR-302", category: "Jewelry", subcategory: "Bracelets", price: "Rs 950", availability: "In stock", images: img("brac2", 1) },
  { id: "er-401", name: "Jhumka Drop Earrings", sku: "ER-401", category: "Jewelry", subcategory: "Earrings", price: "Rs 1,250", availability: "In stock", description: "Classic jhumka with pearl fringe.", images: img("ear1", 3) },
  { id: "er-402", name: "Minimal Gold Studs", sku: "ER-402", category: "Jewelry", subcategory: "Earrings", price: "Rs 700", availability: "In stock", images: img("ear2", 1) },
  { id: "er-403", name: "Statement Hoop Earrings", sku: "ER-403", category: "Jewelry", subcategory: "Earrings", price: "Rs 1,100", availability: "Out of stock", images: img("ear3", 2) },

  // ── Bags ─────────────────────────────────────────────────────────────────────
  { id: "bg-501", name: "Velvet Evening Clutch", sku: "BG-501", category: "Bags", subcategory: "Clutches", price: "Rs 2,800", availability: "In stock", description: "Structured velvet clutch with a detachable chain.", images: img("clutch1", 3), attributes: [{ label: "Colour", value: "Wine" }, { label: "Chain", value: "Detachable" }] },
  { id: "bg-502", name: "Beaded Party Clutch", sku: "BG-502", category: "Bags", subcategory: "Clutches", price: "Rs 3,100", availability: "In stock", images: img("clutch2", 2) },
  { id: "bg-601", name: "Canvas Everyday Tote", sku: "BG-601", category: "Bags", subcategory: "Totes", price: "Rs 2,400", availability: "In stock", description: "Roomy canvas tote with an inner zip pocket.", images: img("tote1", 2) },
  { id: "bg-602", name: "Woven Straw Tote", sku: "BG-602", category: "Bags", subcategory: "Totes", price: "Rs 2,650", availability: "Low stock", images: img("tote2", 3) },
  { id: "bg-701", name: "Quilted Crossbody Bag", sku: "BG-701", category: "Bags", subcategory: "Crossbody", price: "Rs 3,600", availability: "In stock", description: "Quilted crossbody with an adjustable strap.", images: img("cross1", 3) },
  { id: "bg-702", name: "Mini Sling Crossbody", sku: "BG-702", category: "Bags", subcategory: "Crossbody", price: "Rs 1,900", availability: "In stock", images: img("cross2", 1) },

  // ── Accessories ──────────────────────────────────────────────────────────────
  { id: "ac-801", name: "Silk Printed Scarf", sku: "AC-801", category: "Accessories", subcategory: "Scarves", price: "Rs 1,300", availability: "In stock", description: "Lightweight silk-blend scarf in a floral print.", images: img("scarf1", 2) },
  { id: "ac-802", name: "Pashmina Wrap Shawl", sku: "AC-802", category: "Accessories", subcategory: "Scarves", price: "Rs 2,100", availability: "In stock", images: img("scarf2", 2) },
  { id: "ac-901", name: "Oversized Cat-Eye Sunglasses", sku: "AC-901", category: "Accessories", subcategory: "Sunglasses", price: "Rs 1,450", availability: "In stock", description: "UV-protective cat-eye frames with a tortoise finish.", images: img("sun1", 3) },
  { id: "ac-902", name: "Round Retro Sunglasses", sku: "AC-902", category: "Accessories", subcategory: "Sunglasses", price: "Rs 1,200", availability: "In stock", images: img("sun2", 1) },
  { id: "ac-a01", name: "Pearl Hair Clip Set", sku: "AC-A01", category: "Accessories", subcategory: "Hair", price: "Rs 650", availability: "In stock", description: "Set of three pearl-embellished hair clips.", images: img("hair1", 2) },
  { id: "ac-a02", name: "Satin Scrunchie Trio", sku: "AC-A02", category: "Accessories", subcategory: "Hair", price: "Rs 500", availability: "In stock", images: img("hair2", 1) },
  { id: "ac-a03", name: "Embellished Headband", sku: "AC-A03", category: "Accessories", subcategory: "Hair", price: "Rs 850", availability: "Low stock", images: img("hair3", 2) },
  { id: "ac-b01", name: "Leather Belt with Gold Buckle", sku: "AC-B01", category: "Accessories", subcategory: "Belts", price: "Rs 1,750", availability: "In stock", images: img("belt1", 2) },
  { id: "ac-b02", name: "Woven Waist Belt", sku: "AC-B02", category: "Accessories", subcategory: "Belts", price: "Rs 1,050", availability: "In stock", images: img("belt2", 1) },
];

export function mockProducts(): Product[] {
  return seeds.map((s) => ({
    ...s,
    images: s.images,
    attributes: s.attributes ?? [],
  }));
}
