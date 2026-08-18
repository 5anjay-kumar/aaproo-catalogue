# Aaproo Catalogue

A fast, mobile-first digital catalogue for the Aaproo sales team. Browse products
by category, search instantly, open a product, and **download its images** for
social media — no technical knowledge required.

Products come from your **OrderMS** account through a **secure server-side proxy**.
The OrderMS API key lives only on the server and is never exposed to the browser.

---

## Tech stack

| Concern        | Choice                                  | Why |
|----------------|-----------------------------------------|-----|
| Framework      | **Next.js 14** (App Router, TypeScript) | Server code (to hide the key) + a great frontend in one deployable app |
| Styling        | **Tailwind CSS**                        | Fast, consistent, tiny production CSS |
| Hosting        | **Vercel** (recommended)                | One-click deploy, free tier, first-class Next.js support |
| Image handling | Same-origin **image proxy**             | Solves CORS, signed/authenticated URLs, and forced downloads without leaking credentials |
| Zip downloads  | **JSZip** (server-side)                 | "Download all images" as one file |

No database is required. OrderMS responses are cached in-memory on the server.

---

## How the layers separate

```
UI components (React)              components/*, app/page.tsx
        │  (only ever sees the domain model — never raw OrderMS JSON)
Domain model                       lib/catalogue/types.ts
        │
Catalogue service                  lib/orderms/index.ts   → getCatalogue()
        │  (also owns Airtable's records/offset pagination contract)
OrderMS adapter (raw → domain)     lib/orderms/adapter.ts   ← edit field mapping here
        │
OrderMS client (holds the key)     lib/orderms/client.ts    ← server-only
        │
OrderMS API
```

This integration is written specifically for **Airtable's** API shape (`records`/`offset`
pagination, nested `fields`, attachment objects). If a field name or type changes in
Airtable, touch **`adapter.ts`**. If you swap in a different backend entirely with a
different pagination contract, you'll also need to update the fetch loop in
**`index.ts`** — the two files together define "how to talk to this specific backend,"
not `adapter.ts` alone.

---

## Run locally

```bash
npm install
cp .env.example .env.local     # leave ORDERMS_API_BASE_URL empty to use demo data
npm run dev                    # http://localhost:3000
```

Production build:

```bash
npm run build && npm start
```

---

## Connect your real OrderMS data

1. In `.env.local` (and in your host's env settings), set:
   ```
   ORDERMS_API_BASE_URL=https://<your-orderms-api-base-url>
   ORDERMS_API_KEY=<your-secret-key>
   ```
2. If your products endpoint isn't `/products`, set `ORDERMS_PRODUCTS_PATH`.
3. If the key isn't sent as `Authorization: Bearer <key>`, adjust
   `ORDERMS_API_KEY_HEADER` / `ORDERMS_API_KEY_PREFIX`.
4. If images are on a different host, add it to `ORDERMS_IMAGE_HOSTS`.
5. Open `lib/orderms/adapter.ts` and confirm the field names match a real OrderMS
   product (the mapper already tries the most common names).

The app switches from demo to live automatically once `ORDERMS_API_BASE_URL`
and `ORDERMS_API_KEY` are set. The "Demo data" badge disappears.

> ⚠️ **What's still needed from OrderMS** to guarantee a 100% correct live
> integration (see the note the assistant left you): the exact **products
> endpoint path**, the **auth header format**, a **sample product JSON**, and
> the **image URL** shape (public vs. signed/authenticated). Everything else is
> built and ready.

---

## Deploy to Vercel

1. Push this repo to GitHub.
2. On [vercel.com](https://vercel.com) → **New Project** → import the repo.
3. Add environment variables (from `.env.example`) under **Settings → Environment
   Variables**. Mark `ORDERMS_API_KEY` as sensitive.
4. Deploy. Build command `next build` and output are auto-detected.

Any Node host works too (`npm run build` then `npm start`, Node 18.18+).

---

## Security notes

- `lib/orderms/client.ts` and `config.ts` are marked `server-only` — importing
  them from client code is a build error, so the key can't leak into the bundle.
- Browser source maps are disabled in production (`next.config.js`).
- The image proxy only fetches from an allow-list of hosts (no open relay / SSRF).
- Errors shown to users are generic; details are logged server-side only.
- `.env*` is gitignored.

---

## Feature checklist

Catalogue · dynamic categories · subcategories · instant search (name / SKU /
category / subcategory) with result count · responsive grid · product modal with
gallery · **download image** · **download all images (zip)** · **copy name** ·
**copy details** · skeleton loaders · friendly error + retry · empty state ·
mobile bottom-sheet · keyboard & reduced-motion support.
