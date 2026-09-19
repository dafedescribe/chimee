# Chimee Telegram Bot & Next.js Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transition the Chimee store to Next.js + Supabase and implement a Telegram bot for stock management with visual confirmation.

**Architecture:** Next.js App Router for the frontend and API routes. GrammY for Telegram bot logic. Supabase as the primary database.

**Tech Stack:** Next.js 15+, Supabase, GrammY, Tailwind CSS v4, Framer Motion.

---

### Task 1: Supabase Setup & Data Seeding

**Files:**
- Create: `supabase/migrations/20240510_create_products.sql`
- Create: `scripts/seed-supabase.ts`

- [ ] **Step 1: Define the `products` table schema**
Create the migration file with fields: `id`, `name`, `category`, `condition`, `price_numeric`, `stock_count`, `specs` (jsonb), `image_url`, `description`, `is_deal`, `created_at`.

- [ ] **Step 2: Create a seed script to migrate data from constants**
Write a script that reads `src/constants.ts` and inserts them into Supabase.

- [ ] **Step 3: Run the seed script**
Use `tsx` to run the seed script and verify data in Supabase Dashboard.

---

### Task 2: Next.js Migration & Project Structure

**Files:**
- Modify: `package.json`
- Create: `next.config.ts`, `app/layout.tsx`, `app/page.tsx`
- Create: `lib/supabase.ts`

- [ ] **Step 1: Update dependencies**
Add `next`, `grammy`, `@supabase/supabase-js`. Remove `vite` dependencies.

- [ ] **Step 2: Set up Supabase Client**
```typescript
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

- [ ] **Step 3: Move existing components and styles**
Refactor the Navbar and Footer to work in the Next.js App Router.

---

### Task 3: Telegram Bot API Route (The "Brain")

**Files:**
- Create: `lib/bot.ts`
- Create: `app/api/bot/route.ts`

- [ ] **Step 1: Initialize GrammY Bot**
Set up the bot instance with `TELEGRAM_BOT_TOKEN`.

- [ ] **Step 2: Implement Admin Security Middleware**
Ensure only `ADMIN_TELEGRAM_ID` can trigger commands.

- [ ] **Step 3: Create the Webhook Route**
```typescript
export async function POST(req: Request) {
  const body = await req.json();
  await bot.handleUpdate(body);
  return Response.json({ ok: true });
}
```

---

### Task 4: Interactive Bot Logic (Category -> Product -> Stock)

**Files:**
- Modify: `lib/bot.ts`

- [ ] **Step 1: Implement `/manage` Command**
Show "Select Category" buttons: `Phones`, `Laptops`, `Accessories`.

- [ ] **Step 2: Implement Product Selection Menu**
Dynamically fetch products from Supabase based on the selected category and show them as buttons.

- [ ] **Step 3: Implement Stock Control with Visual Confirmation**
Show the product photo (`sendPhoto`) and inline buttons `[-1] [+1] [-5] [+5]`.

- [ ] **Step 4: Implement Supabase Update Logic**
Handle button clicks to increment/decrement `stock_count` in the database.

---

### Task 5: Frontend Refactoring (Supabase Integration)

**Files:**
- Modify: `app/browse/page.tsx`
- Modify: `app/product/[id]/page.tsx`

- [ ] **Step 1: Fetch products from Supabase in `Browse` page**
Replace `PRODUCTS` constant with a server-side fetch.

- [ ] **Step 2: Implement dynamic Product Detail fetching**
Use `supabase.from('products').select().eq('id', id)` in the dynamic route.

- [ ] **Step 3: Verify Stock Updates**
Verify that updating stock via the bot updates the stock count on the website.
