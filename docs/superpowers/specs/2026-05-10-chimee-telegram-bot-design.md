# Design Spec: Chimee Telegram Stock Manager

## 1. Overview
The goal is to transition the current Chimee static React website into a Next.js application integrated with Supabase. A Telegram bot will be hosted within the same codebase via a Next.js API route, allowing the owner to interactively manage product stock levels using inline buttons and visual confirmation.

## 2. Success Criteria
- Website successfully migrated to Next.js.
- Products stored in a Supabase database instead of local constants.
- A functional Telegram bot that allows stock updates via inline buttons.
- **Visual Confirmation**: The bot displays the product photo when managing stock to ensure accuracy.
- Security: Only the authorized admin (hardcoded Telegram ID) can use the bot.
- Data Consistency: Stock updates in Telegram are immediately reflected in the Supabase database.

## 3. Architecture
### 3.1 Stack
- **Framework**: Next.js (App Router)
- **Database**: Supabase (Postgres)
- **Bot Library**: `grammy` (Lightweight and serverless-friendly)
- **Styling**: Tailwind CSS v4 (existing)
- **Animations**: Framer Motion (existing)

### 3.2 Data Flow
1. **Telegram Interaction**: User clicks a button in Telegram.
2. **Webhook**: Telegram sends a POST request to `https://chimee.ng/api/bot`.
3. **API Route Processing**:
   - Validate `chat_id` against `ADMIN_TELEGRAM_ID`.
   - Parse callback query.
   - Update Supabase `products` table.
   - Edit the original Telegram message (including product photo) to show updated stock or a confirmation.
4. **Frontend**: Next.js Server Components fetch the latest stock from Supabase on page load.

## 4. Bot Interaction Design
1. **Command: `/manage`** -> Bot replies with "Select a category" and inline buttons.
2. **Category Selected** -> Bot updates message to "Select a product" with relevant inline buttons.
3. **Product Selected** -> Bot sends/updates message to show the **Product Photo**, Name, and Current Stock.
4. **Stock Control** -> Inline buttons `[-1] [+1] [-5] [+5] [✅ Done]` to update stock. The photo remains visible for continuous visual confirmation.

## 5. Components & Files
- `app/api/bot/route.ts`: Main entry point for the Telegram Webhook.
- `lib/supabase.ts`: Supabase client initialization.
- `lib/bot.ts`: Bot logic, command handlers, and menu builders.
- `app/browse/page.tsx`: Updated to fetch products from Supabase.
- `app/product/[id]/page.tsx`: Updated to fetch single product from Supabase.

## 6. Implementation Steps
1. **Setup Supabase**: Create `products` table and seed with current constants.
2. **Framework Migration**: Move current Vite project files into a Next.js App Router structure.
3. **API Route**: Implement the `/api/bot` route using `grammy`.
4. **Bot Logic**: Build the multi-step interactive menu (Category -> Product -> Stock Control with Photos).
5. **Frontend Integration**: Replace `PRODUCTS` constant usage with Supabase queries.

## 7. Security
- **Admin Verification**: Every request to the bot API will be checked for the `from.id` matching the `ADMIN_TELEGRAM_ID` env variable.
- **Environment Variables**:
  - `TELEGRAM_BOT_TOKEN`
  - `ADMIN_TELEGRAM_ID`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (Used by the bot for write access)

## 8. Future Considerations
- **Real-time**: Use Supabase Realtime to update the website UI without a refresh when the bot changes stock.
- **Image Upload**: Allow the bot to receive a photo and create a new product entry.
