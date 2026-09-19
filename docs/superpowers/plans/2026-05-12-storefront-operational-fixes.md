# Storefront Operational Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the manual storefront operational by removing hardcoded contact links, persisting order leads, using durable banner storage, fixing variation data integrity, and restoring verification checks.

**Architecture:** Keep the existing Next.js + Supabase + Telegram bot shape, but add a small business-config helper, a server-side order lead write path, a durable bot upload helper, and small DB/schema fixes. Preserve the manual-sales conversion path by capturing leads first and then handing the user into WhatsApp with prefilled context.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Supabase, GrammY, ESLint, Tailwind CSS

---

## File Structure

- Modify: `lib/supabase.ts`
  Responsibility: expose clearly separated public and server-side Supabase clients.
- Create: `lib/business.ts`
  Responsibility: normalize env-driven business links and build WhatsApp URLs safely.
- Create: `lib/orders.ts`
  Responsibility: shared server-side order lookup/message helpers.
- Create: `app/order/actions.ts`
  Responsibility: server action that validates and persists order leads.
- Modify: `app/order/page.tsx`
  Responsibility: replace demo-only form with a real lead-capture flow.
- Modify: `app/product/[id]/ProductDetailClient.tsx`
  Responsibility: replace hardcoded WhatsApp link usage.
- Modify: `app/whatsapp/page.tsx`
  Responsibility: use configured WhatsApp channel URL with safe fallback.
- Modify: `components/Footer.tsx`
  Responsibility: use configured social/channel links with safe fallback.
- Modify: `app/page.tsx`
  Responsibility: remove noisy logging and keep server reads aligned with the split Supabase clients.
- Modify: `app/browse/page.tsx`
  Responsibility: keep server reads aligned with the split Supabase clients.
- Modify: `app/product/[id]/page.tsx`
  Responsibility: keep server reads aligned with the split Supabase clients.
- Modify: `lib/bot.ts`
  Responsibility: upload Telegram banner photos to Supabase Storage before DB insert.
- Create: `supabase/migrations/20260512_create_order_inquiries.sql`
  Responsibility: schema for order lead persistence.
- Modify: `supabase/migrations/20260511_create_product_variations.sql`
  Responsibility: fix invalid seeded product references.
- Modify: `scripts/seed-supabase.ts`
  Responsibility: align seed data with migration/product ids.
- Modify: `.gitignore`
  Responsibility: ignore `.next/`.
- Modify: `package.json`
  Responsibility: replace broken lint command with ESLint CLI.
- Modify: `README.md`
  Responsibility: reflect current Next.js/Supabase storefront setup.

### Task 1: Stabilize Supabase Client Boundaries and Business Config

**Files:**
- Create: `lib/business.ts`
- Modify: `lib/supabase.ts`
- Test: `npm run lint -- lib/business.ts lib/supabase.ts`

- [ ] **Step 1: Write the failing test**

No automated test framework exists yet, so use a type- and lint-based red step by creating the new helper API and importing it before implementation. Add these expected call sites in the implementation files first:

```ts
import { businessConfig, buildWhatsAppUrl } from "@/lib/business";
import { publicSupabase, serverSupabase, isSupabaseConfigured } from "@/lib/supabase";
```

Expected initial failure: module/export not found.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run build`
Expected: FAIL with module resolution or missing export errors for `@/lib/business` and the new Supabase client names.

- [ ] **Step 3: Write minimal implementation**

Create `lib/business.ts`:

```ts
const rawWhatsAppNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || "";
const normalizedWhatsAppNumber = rawWhatsAppNumber.replace(/[^\d]/g, "");

export const businessConfig = {
  whatsappNumber: normalizedWhatsAppNumber,
  whatsappChannelUrl: process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL?.trim() || "",
  instagramUrl: process.env.NEXT_PUBLIC_INSTAGRAM_URL?.trim() || "",
  twitterUrl: process.env.NEXT_PUBLIC_TWITTER_URL?.trim() || "",
};

export function buildWhatsAppUrl(message: string) {
  if (!businessConfig.whatsappNumber) return null;
  return `https://wa.me/${businessConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
```

Replace `lib/supabase.ts` with:

```ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const isSupabaseConfigured = Boolean(supabaseUrl && (supabaseAnonKey || supabaseServiceKey));

export const publicSupabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

export const serverSupabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseServiceKey || supabaseAnonKey || "placeholder"
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run build`
Expected: PASS this boundary/import issue and move on to the next real failure.

- [ ] **Step 5: Commit**

```bash
git add lib/business.ts lib/supabase.ts
git commit -m "refactor: split supabase clients and add business config"
```

### Task 2: Persist Order Leads Before Showing Success

**Files:**
- Create: `lib/orders.ts`
- Create: `app/order/actions.ts`
- Modify: `app/order/page.tsx`
- Test: `npm run build`

- [ ] **Step 1: Write the failing test**

Replace the current fake submit path in `app/order/page.tsx` with a call to a not-yet-implemented server action:

```ts
import { submitOrderInquiry } from "./actions";
```

Expected initial failure: `./actions` or `submitOrderInquiry` missing.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run build`
Expected: FAIL with missing module/export errors for `app/order/actions.ts`.

- [ ] **Step 3: Write minimal implementation**

Create `lib/orders.ts`:

```ts
import { buildWhatsAppUrl } from "@/lib/business";

export function buildOrderMessage(input: {
  productName: string;
  variationName?: string | null;
  customerName: string;
  phoneNumber: string;
  deliveryAddress: string;
}) {
  const variationLine = input.variationName ? `Variation: ${input.variationName}\n` : "";
  return `Hello, I want to place an order.\nProduct: ${input.productName}\n${variationLine}Name: ${input.customerName}\nPhone: ${input.phoneNumber}\nAddress: ${input.deliveryAddress}`;
}

export function buildOrderWhatsAppUrl(input: {
  productName: string;
  variationName?: string | null;
  customerName: string;
  phoneNumber: string;
  deliveryAddress: string;
}) {
  return buildWhatsAppUrl(buildOrderMessage(input));
}
```

Create `app/order/actions.ts`:

```ts
"use server";

import { serverSupabase } from "@/lib/supabase";
import { buildOrderWhatsAppUrl } from "@/lib/orders";

export async function submitOrderInquiry(formData: FormData) {
  const productId = String(formData.get("productId") || "");
  const variationId = String(formData.get("variationId") || "");
  const customerName = String(formData.get("customerName") || "").trim();
  const phoneNumber = String(formData.get("phoneNumber") || "").trim();
  const deliveryAddress = String(formData.get("deliveryAddress") || "").trim();

  if (!productId || !customerName || !phoneNumber || !deliveryAddress) {
    return { ok: false as const, error: "Please complete all required fields." };
  }

  const { data: product, error: productError } = await serverSupabase
    .from("products")
    .select("id, name, product_variations(id, name)")
    .eq("id", productId)
    .single();

  if (productError || !product) {
    return { ok: false as const, error: "Selected product could not be found." };
  }

  const variation = Array.isArray(product.product_variations)
    ? product.product_variations.find((item) => item.id === variationId) || null
    : null;

  const { error } = await serverSupabase.from("order_inquiries").insert({
    product_id: product.id,
    variation_id: variation?.id || null,
    customer_name: customerName,
    phone_number: phoneNumber,
    delivery_address: deliveryAddress,
  });

  if (error) {
    return { ok: false as const, error: "We could not save your order right now." };
  }

  return {
    ok: true as const,
    whatsappUrl: buildOrderWhatsAppUrl({
      productName: product.name,
      variationName: variation?.name || null,
      customerName,
      phoneNumber,
      deliveryAddress,
    }),
  };
}
```

Replace `app/order/page.tsx` with a client form that:

- fetches the product with `publicSupabase`
- reads `id` and `variation` from `useSearchParams`
- keeps controlled state for `customerName`, `phoneNumber`, `deliveryAddress`
- calls `submitOrderInquiry` on submit via `startTransition`
- shows success only when `result.ok === true`
- renders a WhatsApp link only when `result.whatsappUrl` exists

Use this success-state shape:

```tsx
{submitted && (
  <div>
    <h2>Order Received.</h2>
    <p>Your request has been saved and sent to our priority queue.</p>
    {submitted.whatsappUrl ? (
      <a href={submitted.whatsappUrl} target="_blank" rel="noreferrer">Continue to WhatsApp</a>
    ) : (
      <p>WhatsApp is not configured yet. Our team will still review your saved request.</p>
    )}
  </div>
)}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run build`
Expected: PASS with the order page compiling and no fake-submit logic remaining.

- [ ] **Step 5: Commit**

```bash
git add lib/orders.ts app/order/actions.ts app/order/page.tsx
git commit -m "feat: persist storefront order inquiries"
```

### Task 3: Remove Hardcoded WhatsApp and Social Links from UI

**Files:**
- Modify: `app/product/[id]/ProductDetailClient.tsx`
- Modify: `app/whatsapp/page.tsx`
- Modify: `components/Footer.tsx`
- Test: `npm run build`

- [ ] **Step 1: Write the failing test**

Update these files to import `businessConfig` and `buildWhatsAppUrl` before implementing their usage:

```ts
import { businessConfig, buildWhatsAppUrl } from "@/lib/business";
```

Expected initial failure: unused/broken behavior until the UI is rewritten to use these imports.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run lint`
Expected: FAIL or report issues until the UI components use the new config-driven links cleanly.

- [ ] **Step 3: Write minimal implementation**

In `app/product/[id]/ProductDetailClient.tsx`:

- replace `window.open('https://wa.me/2348000000000?...')` with:

```ts
const whatsappUrl = buildWhatsAppUrl(whatsappMessage);
```

and render:

```tsx
{whatsappUrl ? (
  <a href={whatsappUrl} target="_blank" rel="noreferrer" className="...">Order via WhatsApp</a>
) : (
  <button type="button" disabled className="... opacity-50 cursor-not-allowed">WhatsApp Not Configured</button>
)}
```

In `app/whatsapp/page.tsx`:

- replace the hardcoded channel URL with `businessConfig.whatsappChannelUrl`
- render a disabled state if missing

In `components/Footer.tsx`:

- replace `href="#"` placeholders with configured links
- hide anchors whose URLs are missing

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run build`
Expected: PASS with no hardcoded business URLs left in those components.

- [ ] **Step 5: Commit**

```bash
git add app/product/[id]/ProductDetailClient.tsx app/whatsapp/page.tsx components/Footer.tsx
git commit -m "feat: use configured storefront contact links"
```

### Task 4: Make Telegram Banner Images Durable

**Files:**
- Modify: `lib/bot.ts`
- Test: `npm run build`

- [ ] **Step 1: Write the failing test**

Refactor `lib/bot.ts` to call a not-yet-implemented helper in the photo flow:

```ts
const publicUrl = await uploadTelegramBannerToStorage(file.file_path);
```

Expected initial failure: helper not defined.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run build`
Expected: FAIL with missing helper/function errors in `lib/bot.ts`.

- [ ] **Step 3: Write minimal implementation**

Add this helper near the top of `lib/bot.ts`:

```ts
async function uploadTelegramBannerToStorage(filePath: string) {
  const supabase = getSupabase();
  if (!supabase || !token) throw new Error("Storage upload is not configured.");

  const telegramUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
  const response = await fetch(telegramUrl);

  if (!response.ok) {
    throw new Error(`Telegram download failed with status ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const fileExt = filePath.split(".").pop() || "jpg";
  const storagePath = `telegram-banners/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("banners")
    .upload(storagePath, arrayBuffer, {
      contentType: response.headers.get("content-type") || "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from("banners").getPublicUrl(storagePath);
  return data.publicUrl;
}
```

Update the photo handler to use:

```ts
const publicUrl = await uploadTelegramBannerToStorage(file.file_path!);
```

and store `publicUrl` in `userStates`.

Wrap upload failures with:

```ts
try {
  // upload flow
} catch (error) {
  console.error("Error uploading banner image:", error);
  userStates.delete(ctx.from.id);
  await ctx.reply("Failed to save the banner image. Please try again.");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run build`
Expected: PASS with the bot compiling and no temporary Telegram URL persistence left in the banner flow.

- [ ] **Step 5: Commit**

```bash
git add lib/bot.ts
git commit -m "feat: persist telegram banner images in storage"
```

### Task 5: Fix Variation and Inquiry Schema Data Integrity

**Files:**
- Create: `supabase/migrations/20260512_create_order_inquiries.sql`
- Modify: `supabase/migrations/20260511_create_product_variations.sql`
- Modify: `scripts/seed-supabase.ts`
- Test: `npm run build`

- [ ] **Step 1: Write the failing test**

Introduce the new order inquiry table usage in `app/order/actions.ts` before the migration exists.

Expected initial failure mode at runtime: inserts would fail against a DB without the table. The code build should still pass, so the red step here is a schema gap recorded in the migration layer.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run build`
Expected: PASS build, but note that the database schema is incomplete until the migration is added. This task closes that runtime gap.

- [ ] **Step 3: Write minimal implementation**

Create `supabase/migrations/20260512_create_order_inquiries.sql`:

```sql
CREATE TABLE IF NOT EXISTS public.order_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    variation_id UUID NULL REFERENCES public.product_variations(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.order_inquiries ENABLE ROW LEVEL SECURITY;
```

Update `supabase/migrations/20260511_create_product_variations.sql` to use:

```sql
INSERT INTO public.product_variations (product_id, name, price_numeric, stock_count)
VALUES
    ('iphone-15-pro', '256GB / UK Used', 1250000, 5),
    ('iphone-15-pro', '512GB / UK Used', 1450000, 3),
    ('iphone-15-pro', '256GB / Brand New', 1650000, 2);
```

Update `scripts/seed-supabase.ts` only as needed to keep ids aligned with product lookups and comments.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run build`
Expected: PASS with schema/source files aligned to the live app flow.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260512_create_order_inquiries.sql supabase/migrations/20260511_create_product_variations.sql scripts/seed-supabase.ts
git commit -m "fix: align storefront schema with live order flow"
```

### Task 6: Restore Verification and Repository Hygiene

**Files:**
- Modify: `package.json`
- Modify: `.gitignore`
- Modify: `README.md`
- Modify: `app/globals.css`
- Test: `npm run lint`
- Test: `npm run build`

- [ ] **Step 1: Write the failing test**

Keep the current broken lint command and run it as the red step.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run lint`
Expected: FAIL with the circular JSON/config error from `next lint`.

- [ ] **Step 3: Write minimal implementation**

Update `package.json` scripts:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint . --ext .js,.jsx,.ts,.tsx"
}
```

Update `.gitignore`:

```gitignore
.next/
```

Update `app/globals.css` so the Google Fonts `@import url(...)` stays before all other non-charset statements.

Update `README.md` to describe:

- required env vars for Supabase and business links
- `npm install`
- `npm run dev`
- optional bot/banner setup notes

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run lint`
Expected: PASS

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json .gitignore README.md app/globals.css
git commit -m "chore: restore storefront verification and docs"
```
