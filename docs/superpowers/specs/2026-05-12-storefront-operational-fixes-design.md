# Storefront Operational Fixes Design

## Goal

Patch the current Chimee storefront so the real manual-sales flow works reliably:

- visitors can browse inventory and contact the owner through configured business links
- the order form captures a lead before handing the visitor to WhatsApp
- Telegram-managed promo banners use durable image URLs
- product and variation data stay internally consistent
- basic repository/runtime hygiene supports maintenance

## Scope

In scope:

- contact-link configuration
- order lead persistence
- WhatsApp handoff after lead capture
- Supabase storage for banner images
- migration/seed consistency fixes
- lint and repo hygiene fixes directly related to shipping this storefront

Out of scope:

- payment processing
- automated checkout
- full admin dashboard
- CRM/workflow beyond storing order leads

## Current Problems

1. Contact actions are not production-ready because the WhatsApp number and channel URLs are placeholders or disconnected from deploy-time configuration.
2. The order page behaves like a successful checkout confirmation but does not persist or notify anything.
3. The order page reads a local `PRODUCTS` constant instead of live Supabase inventory and ignores variation context.
4. Telegram banner creation stores temporary Telegram file URLs, which expire.
5. Product variation seed data references the wrong product id and can fail foreign-key insertion.
6. Linting and repo hygiene are currently broken or outdated, which weakens CI and maintenance.

## Chosen Approach

Use configuration-driven contact links, persist order leads in Supabase, then redirect or offer a WhatsApp handoff with a prefilled message. Persist Telegram banner images into Supabase Storage and store the resulting durable public URL in the `banners` table.

This preserves the existing manual-sales model while making the funnel operational and supportable without introducing unnecessary product complexity.

## Architecture

### Contact Configuration

Introduce a small server-safe configuration module for business contact details sourced from environment variables.

Expected configuration:

- `NEXT_PUBLIC_WHATSAPP_NUMBER`
- `NEXT_PUBLIC_WHATSAPP_CHANNEL_URL`
- `NEXT_PUBLIC_INSTAGRAM_URL`
- `NEXT_PUBLIC_TWITTER_URL`

Behavior:

- UI components consume normalized derived values instead of building links ad hoc.
- If a contact value is missing, the corresponding CTA is disabled or hidden with safe fallback copy.
- No business contact value is hardcoded in React components.

### Order Lead Flow

The order form remains part of the storefront, but becomes an actual lead-capture step.

Flow:

1. Product page links to `/order?id=<productId>&variation=<variationId?>`
2. Order page loads product data from Supabase, not local constants
3. Visitor submits name, phone, and address
4. App inserts a record into a new `order_inquiries` table
5. On success, UI confirms receipt and immediately offers or opens a WhatsApp conversation with a prefilled message that includes product/variation context

This means the owner has a stored lead even if the user drops off after the redirect to WhatsApp.

### Banner Image Persistence

Telegram photo handling changes from “store Telegram file URL directly” to:

1. bot fetches Telegram file metadata
2. bot downloads the image bytes
3. bot uploads the image into a Supabase Storage bucket
4. bot stores the resulting durable public URL in `banners.image_url`

The bot remains the content-management entry point, but the homepage only renders durable assets.

### Data Integrity

Align seeded product ids and variation references so migrations and live queries agree on the same product keys. Remove dependence on the old local `PRODUCTS` constant for operational pages.

## Components and File Changes

### Config Layer

- add a small config/helper module under `lib/` for business URLs and derived WhatsApp links

Responsibilities:

- normalize phone number for `wa.me`
- expose channel/social URLs
- expose safe booleans for UI state

### Order Page

- replace constant-backed product lookup with Supabase-backed loading
- capture form data in controlled state
- submit to a server endpoint or server action that writes to Supabase
- include variation context in saved lead and WhatsApp message

The page should no longer claim success without persistence.

### Product Detail Page

- replace placeholder WhatsApp number usage with configured WhatsApp link generation
- preserve variation-aware messaging

### WhatsApp and Footer CTAs

- use configured links
- hide or disable CTAs if configuration is absent

### Telegram Bot

- add durable upload flow to Supabase Storage
- keep existing admin-only control model
- keep banner DB insert/update behavior otherwise simple

### Database

Add:

- `order_inquiries` table for lead capture

Adjust:

- product variation seed/migration data to reference valid product ids

Potential storage bucket:

- `banners`

## Data Model

### `order_inquiries`

Proposed fields:

- `id uuid primary key default gen_random_uuid()`
- `product_id text not null references public.products(id)`
- `variation_id uuid null references public.product_variations(id)`
- `customer_name text not null`
- `phone_number text not null`
- `delivery_address text not null`
- `status text not null default 'new'`
- `created_at timestamptz not null default timezone('utc', now())`

RLS:

- enable RLS
- allow public insert only if the app needs direct client submission
- disallow public select/update/delete

Preferred implementation is server-side insertion using the service role on the server, which reduces the need for permissive public insert policies.

## Error Handling

### Contact Configuration Missing

- user-facing buttons that depend on missing config should not render as active links
- order capture can still work without social links, but WhatsApp handoff should show a clear fallback message if the number is missing

### Order Submission Failure

- keep the user on the form
- show a clear submission error
- never show the success state unless the insert succeeded

### Banner Upload Failure

- bot should reply with a failure message and avoid inserting a broken banner row
- partial failures should be logged with enough detail to diagnose whether fetch, upload, or DB insert failed

## Testing

Focus tests on the behavioral regressions that matter for the storefront:

- config helper builds correct WhatsApp URLs and handles missing values safely
- order submission path fails before implementation, then passes after persistence is added
- order success state appears only after successful lead insertion
- variation context is included in lead persistence and WhatsApp handoff
- banner upload utility returns durable storage URLs rather than Telegram temp URLs

Verification commands after implementation:

- `npm run lint`
- `npm run build`

## Rollout Notes

- deployment will require the new contact-related environment variables
- Supabase will require the new table migration and storage bucket setup
- existing banner records that point at Telegram temp URLs may need to be recreated manually if already expired

## Success Criteria

The work is complete when:

1. no storefront CTA relies on hardcoded business contact info
2. order submissions are persisted before success is shown
3. order flow includes product and variation context
4. Telegram-created banners remain visible after their original Telegram URL lifetime
5. product variations resolve correctly from live data
6. `npm run lint` and `npm run build` both succeed
