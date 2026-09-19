# Vite to Next.js Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the Chimee project from Vite to Next.js App Router, preserving design and functionality while enabling SSR and improved SEO.

**Architecture:** Next.js App Router (v15) with client-side interactivity using Framer Motion. Pages are initially kept as client components for a smooth transition.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS (v4), Framer Motion, Lucide React.

---

### Task 1: Setup Shared Resources

**Files:**
- Create: `types/index.ts`
- Create: `constants/index.ts`
- Create: `hooks/useLocalStorage.ts`
- Create: `lib/supabase.ts`

- [ ] **Step 1: Move types**
Copy `src/types.ts` to `types/index.ts`.

- [ ] **Step 2: Move constants**
Copy `src/constants.ts` to `constants/index.ts`.

- [ ] **Step 3: Move hooks**
Copy `src/hooks/useLocalStorage.ts` to `hooks/useLocalStorage.ts`.

- [ ] **Step 4: Create Supabase placeholder**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Task 2: Relocate Components and Styles

**Files:**
- Create: `components/Navbar.tsx`
- Create: `components/Footer.tsx`
- Create: `components/ui/` (copy from `src/components/ui/`)
- Create: `app/globals.css`

- [ ] **Step 1: Relocate Navbar**
Extract `src/components/Navbar.tsx` to `components/Navbar.tsx`. Update imports to use `@/` or relative paths. Mark as `'use client'`.

- [ ] **Step 2: Relocate Footer**
Extract `src/components/Footer.tsx` to `components/Footer.tsx`. Mark as `'use client'`.

- [ ] **Step 3: Relocate UI components**
Copy all files from `src/components/ui/` to `components/ui/`.

- [ ] **Step 4: Setup global styles**
Copy `src/index.css` to `app/globals.css`.

### Task 3: Root Layout and Home Page

**Files:**
- Create: `app/layout.tsx`
- Create: `app/page.tsx`

- [ ] **Step 1: Implement Root Layout**
Use logic from `src/App.tsx` and `src/main.tsx`.
```tsx
import type { Metadata } from "next";
import { Syne, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import NavbarWrapper from "@/components/NavbarWrapper"; // Need a wrapper for state
import Footer from "@/components/Footer";

const syne = Syne({
  variable: "--font-sans",
  subsets: ["latin"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-serif",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chimee Lagos | Premium UK Used Phones & Laptops",
  description: "Curated selection of luxury tech in Lagos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${dmSerif.variable} antialiased bg-chimee-black text-white`}>
        <NavbarWrapper />
        <main className="pt-24">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Implement Home Page**
Extract `src/pages/Home.tsx` to `app/page.tsx`. Mark as `'use client'`. Replace `onNavigate` and `onProductClick` with `Link` or `useRouter`.

### Task 4: Browse and Product Pages

**Files:**
- Create: `app/browse/page.tsx`
- Create: `app/product/[id]/page.tsx`

- [ ] **Step 1: Implement Browse Page**
Extract `src/pages/Browse.tsx` to `app/browse/page.tsx`. Mark as `'use client'`.

- [ ] **Step 2: Implement Product Detail Page**
Extract `src/pages/ProductDetail.tsx` to `app/product/[id]/page.tsx`. Mark as `'use client'`. Use `useParams` to get ID and find product from constants.

### Task 5: Order and WhatsApp Pages

**Files:**
- Create: `app/order/page.tsx`
- Create: `app/whatsapp/page.tsx`

- [ ] **Step 1: Implement Order Page**
Extract `src/pages/Order.tsx` to `app/order/page.tsx`.

- [ ] **Step 2: Implement WhatsApp Page**
Extract `src/pages/WhatsApp.tsx` to `app/whatsapp/page.tsx`.

### Task 6: Cleanup and Validation

- [ ] **Step 1: Run build**
Run: `npm run build`
Expected: Successful build.

- [ ] **Step 2: Manual testing**
Verify all links and animations in dev mode (`npm run dev`).
