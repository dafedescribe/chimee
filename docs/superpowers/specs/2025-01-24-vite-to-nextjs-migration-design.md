# Design Spec: Vite to Next.js Migration for Chimee

## 1. Overview
Migrate the Chimee project from Vite to Next.js App Router to take advantage of server-side rendering, improved SEO, and better performance while maintaining the existing design and functionality.

## 2. Architecture
- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS (v4)
- **Interactivity:** Framer Motion
- **Data:** Mock data from `constants.ts` (initially)

## 3. Structural Changes
### 3.1 App Directory (`app/`)
- `layout.tsx`: Root layout containing global styles, fonts, and common UI elements like Navbar and Footer.
- `page.tsx`: Home page (extracted from `src/pages/Home.tsx`).
- `browse/page.tsx`: Browse page (extracted from `src/pages/Browse.tsx`).
- `product/[id]/page.tsx`: Dynamic route for product details (extracted from `src/pages/ProductDetail.tsx`).
- `order/page.tsx`: Order form page (extracted from `src/pages/Order.tsx`).
- `whatsapp/page.tsx`: WhatsApp redirect page (extracted from `src/pages/WhatsApp.tsx`).

### 3.2 Component Relocation
- Move `src/components/*` to `components/`.
- Move `src/hooks/*` to `hooks/`.
- Move `src/styles/index.css` to `app/globals.css` (or import directly in layout).
- Move `src/types.ts` to `types/index.ts`.
- Move `src/constants.ts` to `constants/index.ts`.

### 3.3 Lib Directory
- Create `lib/supabase.ts` for future Supabase integration.

## 4. Implementation Details
- **Client Components:** Pages and components requiring interactivity (e.g., Framer Motion, hooks) will be marked with `'use client'`.
- **Navigation:** Replace `navigateTo` logic from `src/App.tsx` with Next.js `Link` and `useRouter`.
- **State Management:** Use `useState` for simple UI state; `useLocalStorage` for wishlist.

## 5. Success Criteria
- [ ] Application builds successfully without errors.
- [ ] All routes (`/`, `/browse`, `/product/[id]`, `/order`, `/whatsapp`) function as expected.
- [ ] Styling and animations are preserved.
- [ ] SEO metadata is correctly implemented in `layout.tsx`.

## 6. Self-Review
- **Placeholder scan:** No TBDs.
- **Internal consistency:** Architecture matches feature descriptions.
- **Scope check:** Focused on migration.
- **Ambiguity check:** Explicit path mapping provided.
