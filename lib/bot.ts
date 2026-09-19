import { Bot, InlineKeyboard } from "grammy";
import { createClient } from "@supabase/supabase-js";

const token = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_IDS = (process.env.ADMIN_TELEGRAM_ID || "")
  .split(",")
  .map((id) => Number(id.trim()))
  .filter((id) => id > 0);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const getSupabase = () => {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
};

// HTML escape for Telegram
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Truncate for button labels (Telegram max ~64 chars)
function trunc(s: string, max = 40): string {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

// Per-user state management
type UserState = {
  step: string;
  adData: { image_url?: string; link_url?: string; title?: string };
  productData: {
    id?: string; name?: string; category?: string; condition?: string;
    price?: number; description?: string; images?: string[];
  };
  editField?: string;
  editProductId?: string;
  stockProductId?: string;
  varProductId?: string;
  varName?: string;
};

const defaultState = (): UserState => ({ step: "idle", adData: {}, productData: {} });
const userStates = new Map<number, UserState>();
const getState = (userId: number) => {
  if (!userStates.has(userId)) userStates.set(userId, defaultState());
  return userStates.get(userId)!;
};

// Short-key lookup (Telegram limits callback_data to 64 bytes)
let keyCounter = 0;
const keyToId = new Map<string, string>();
const idToKey = new Map<string, string>();
function sk(id: string): string {
  if (idToKey.has(id)) return idToKey.get(id)!;
  const key = (++keyCounter).toString(36);
  keyToId.set(key, id);
  idToKey.set(id, key);
  return key;
}
function rk(key: string): string {
  return keyToId.get(key) || key;
}

// Helper: upload photo to Supabase Storage
async function uploadPhoto(bucket: string, fileId: string, botInstance: Bot): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const file = await botInstance.api.getFile(fileId);
    const telegramUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
    const response = await fetch(telegramUrl);
    const buffer = new Uint8Array(await response.arrayBuffer());
    const fileName = `${bucket}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, buffer, { contentType: "image/jpeg", upsert: false });
    if (error) { console.error(`Upload error (${bucket}):`, error); return telegramUrl; }
    return supabase.storage.from(bucket).getPublicUrl(fileName).data.publicUrl;
  } catch (err) { console.error("Photo upload error:", err); return null; }
}

// Notify all admins
async function notifyAdmins(botInstance: Bot, message: string) {
  for (const adminId of ADMIN_IDS) {
    try { await botInstance.api.sendMessage(adminId, message, { parse_mode: "HTML" }); }
    catch (err) { console.error(`Failed to notify admin ${adminId}:`, err); }
  }
}
export { notifyAdmins };

export const bot = token ? new Bot(token) : null;

if (bot) {
  // ── AUTH ──
  bot.use(async (ctx, next) => {
    if (!ctx.from || !ADMIN_IDS.includes(ctx.from.id)) {
      await ctx.reply("⛔ Not authorized.");
      return;
    }
    await next();
  });

  // ── START / HELP / CANCEL ──
  bot.command("start", async (ctx) => {
    await ctx.reply(
      `👋 <b>Chimee Admin Bot</b>\n\n` +
      `📦 /manage — Stock\n🆕 /add — Add product\n✏️ /edit — Edit product\n🗑️ /remove — Delete product\n` +
      `🔀 /variations — Variants\n📢 /ads — Create banner\n📋 /manage_ads — Banners\n` +
      `📊 /orders — Orders\n🔄 /update_order — Order status\n📋 /requests — Requests\n` +
      `👁️ /preview — Preview on site\n❌ /cancel — Cancel\n🔧 /help — This menu`,
      { parse_mode: "HTML" }
    );
  });
  bot.command("help", async (ctx) => {
    await ctx.reply(
      `<b>Commands</b>\n\n📦 /manage — Stock\n🆕 /add — Add\n✏️ /edit — Edit\n🗑️ /remove — Delete\n` +
      `🔀 /variations — Variants\n📢 /ads — Banner\n📋 /manage_ads — Banners\n` +
      `📊 /orders — Orders\n🔄 /update_order — Status\n📋 /requests — Requests\n❌ /cancel — Cancel`,
      { parse_mode: "HTML" }
    );
  });
  bot.command("cancel", async (ctx) => {
    userStates.set(ctx.from!.id, defaultState());
    await ctx.reply("✅ Cancelled.");
  });

  // ── ADD PRODUCT ──
  bot.command("add", async (ctx) => {
    const state = getState(ctx.from!.id);
    state.step = "add_name";
    state.productData = {};
    await ctx.reply("🆕 <b>Add Product</b>\n\nStep 1/6: Product name?\n\n<i>e.g. iPhone 15 Pro Max</i>", { parse_mode: "HTML" });
  });

  // ── EDIT PRODUCT ──
  bot.command("edit", async (ctx) => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data: products } = await supabase.from("products").select("id, name").order("created_at", { ascending: false });
    if (!products?.length) { await ctx.reply("No products."); return; }
    const kb = new InlineKeyboard();
    products.forEach((p) => kb.text(trunc(p.name), `es:${sk(p.id)}`).row());
    await ctx.reply("✏️ Select product:", { reply_markup: kb });
  });

  bot.callbackQuery(/^es:(.+)$/, async (ctx) => {
    const pid = rk(ctx.match[1]);
    const k = sk(pid);
    const kb = new InlineKeyboard()
      .text("📝 Name", `ef:${k}:name`).text("💰 Price", `ef:${k}:price`).row()
      .text("📂 Category", `ef:${k}:cat`).text("🏷️ Condition", `ef:${k}:cond`).row()
      .text("📄 Desc", `ef:${k}:desc`).text("🖼️ Image", `ef:${k}:image`).row()
      .text("🔥 Toggle Deal", `ef:${k}:deal`);
    await ctx.editMessageText("What to edit?", { reply_markup: kb });
  });

  bot.callbackQuery(/^ef:(.+):(.+)$/, async (ctx) => {
    const pid = rk(ctx.match[1]);
    const field = ctx.match[2];
    const state = getState(ctx.from!.id);
    const supabase = getSupabase();
    if (!supabase) return;

    if (field === "deal") {
      const { data: p } = await supabase.from("products").select("is_deal, name").eq("id", pid).single();
      if (!p) { await ctx.answerCallbackQuery("Not found."); return; }
      await supabase.from("products").update({ is_deal: !p.is_deal }).eq("id", pid);
      await ctx.answerCallbackQuery(`Deal ${!p.is_deal ? "ON 🔥" : "OFF"}`);
      return;
    }
    if (field === "cat") {
      const kb = new InlineKeyboard()
        .text("📱 Phones", `ev:${sk(pid)}:category:Phones`)
        .text("💻 Laptops", `ev:${sk(pid)}:category:Laptops`).row()
        .text("🎧 Accessories", `ev:${sk(pid)}:category:Accessories`);
      await ctx.editMessageText("Select category:", { reply_markup: kb });
      return;
    }
    if (field === "cond") {
      const kb = new InlineKeyboard()
        .text("Brand New", `ev:${sk(pid)}:condition:Brand New`).row()
        .text("UK Used", `ev:${sk(pid)}:condition:UK Used`).row()
        .text("Nigerian Used", `ev:${sk(pid)}:condition:Nigerian Used`);
      await ctx.editMessageText("Select condition:", { reply_markup: kb });
      return;
    }
    state.step = "edit_value";
    state.editProductId = pid;
    state.editField = field === "desc" ? "description" : field;
    const prompts: Record<string, string> = {
      name: "Send new name:", price: "Send new price (numbers):",
      description: "Send new description:", image: "Send new photo:",
    };
    await ctx.editMessageText(prompts[state.editField!] || "Send new value:");
  });

  bot.callbackQuery(/^ev:(.+):(.+):(.+)$/, async (ctx) => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.from("products").update({ [ctx.match[2]]: ctx.match[3] }).eq("id", rk(ctx.match[1]));
    await ctx.editMessageText(`✅ Updated. /edit to continue.`);
  });

  // ── REMOVE PRODUCT ──
  bot.command("remove", async (ctx) => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data: products } = await supabase.from("products").select("id, name").order("created_at", { ascending: false });
    if (!products?.length) { await ctx.reply("No products."); return; }
    const kb = new InlineKeyboard();
    products.forEach((p) => kb.text(`🗑️ ${trunc(p.name, 35)}`, `rc:${sk(p.id)}`).row());
    await ctx.reply("⚠️ Select product to <b>delete</b>:", { reply_markup: kb, parse_mode: "HTML" });
  });

  bot.callbackQuery(/^rc:(.+)$/, async (ctx) => {
    const pid = rk(ctx.match[1]);
    const kb = new InlineKeyboard().text("✅ Yes, delete", `ry:${sk(pid)}`).text("❌ Cancel", "rn");
    const supabase = getSupabase();
    const { data: p } = await supabase!.from("products").select("name").eq("id", pid).single();
    await ctx.editMessageText(`Delete "${esc(p?.name || pid)}"? Cannot be undone.`, { reply_markup: kb });
  });

  bot.callbackQuery(/^ry:(.+)$/, async (ctx) => {
    const supabase = getSupabase();
    if (!supabase) return;
    const pid = rk(ctx.match[1]);
    await supabase.from("product_images").delete().eq("product_id", pid);
    await supabase.from("product_variations").delete().eq("product_id", pid);
    const { error } = await supabase.from("products").delete().eq("id", pid);
    await ctx.editMessageText(error ? "❌ Failed — orders may reference it." : "✅ Deleted.");
  });

  bot.callbackQuery("rn", async (ctx) => { await ctx.editMessageText("Cancelled."); });

  // ── ORDERS ──
  bot.command("orders", async (ctx) => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data: orders } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(10);
    if (!orders?.length) { await ctx.reply("No orders yet."); return; }
    let msg = "📊 <b>Recent Orders</b>\n\n";
    for (const o of orders) {
      const date = new Date(o.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
      const e = o.status === "pending" ? "🟡" : o.status === "confirmed" ? "🟢" : "✅";
      msg += `${e} <b>${esc(o.product_name)}</b>${o.variation_name ? ` (${esc(o.variation_name)})` : ""}\n   💰 ₦${o.price_at_order?.toLocaleString() || "N/A"}\n   👤 ${esc(o.customer_name)} — ${o.customer_phone}\n   📍 ${esc(o.delivery_address)}\n   📅 ${date}\n\n`;
    }
    await ctx.reply(msg, { parse_mode: "HTML" });
  });

  // ── STOCK MANAGEMENT ──
  bot.command("manage", async (ctx) => {
    const kb = new InlineKeyboard().text("📱 Phones", "ct:Phones").text("💻 Laptops", "ct:Laptops").row().text("🎧 Accessories", "ct:Accessories");
    await ctx.reply("Select category:", { reply_markup: kb });
  });
  bot.command("stock", async (ctx) => {
    const kb = new InlineKeyboard().text("📱 Phones", "ct:Phones").text("💻 Laptops", "ct:Laptops").row().text("🎧 Accessories", "ct:Accessories");
    await ctx.reply("Select category:", { reply_markup: kb });
  });

  bot.callbackQuery(/^ct:(.+)$/, async (ctx) => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data: products } = await supabase.from("products").select("id, name, stock_count").eq("category", ctx.match[1]);
    if (!products?.length) { await ctx.answerCallbackQuery("Empty."); return; }
    const kb = new InlineKeyboard();
    products.forEach((p) => kb.text(`${trunc(p.name, 30)} (${p.stock_count})`, `pd:${sk(p.id)}`).row());
    kb.text("⬅️ Back", "mb");
    await ctx.editMessageText(`📦 <b>${esc(ctx.match[1])}</b>:`, { reply_markup: kb, parse_mode: "HTML" });
  });

  bot.callbackQuery("mb", async (ctx) => {
    const kb = new InlineKeyboard().text("📱 Phones", "ct:Phones").text("💻 Laptops", "ct:Laptops").row().text("🎧 Accessories", "ct:Accessories");
    await ctx.editMessageText("Select category:", { reply_markup: kb });
  });

  bot.callbackQuery(/^pd:(.+)$/, async (ctx) => {
    const supabase = getSupabase();
    if (!supabase) return;
    const pid = rk(ctx.match[1]);
    const { data: p } = await supabase.from("products").select("*").eq("id", pid).single();
    if (!p) { await ctx.answerCallbackQuery("Not found."); return; }
    const k = sk(pid);
    const kb = new InlineKeyboard()
      .text("-1", `st:${k}:-1`).text("+1", `st:${k}:1`).row()
      .text("-5", `st:${k}:-5`).text("+5", `st:${k}:5`).row()
      .text("🔢 Set Exact", `sx:${k}`).row()
      .text("⬅️ Back", `ct:${p.category}`).text("✅ Done", "dm");
    const msg = `<b>${esc(p.name)}</b>\nCategory: ${p.category}\nCondition: ${p.condition}\nStock: <b>${p.stock_count}</b>\nPrice: ₦${p.price_numeric?.toLocaleString()}`;
    await ctx.deleteMessage();
    if (p.image_url) {
      await ctx.replyWithPhoto(p.image_url, { caption: msg, parse_mode: "HTML", reply_markup: kb });
    } else {
      await ctx.reply(msg, { parse_mode: "HTML", reply_markup: kb });
    }
  });

  bot.callbackQuery(/^st:(.+):(-?\d+)$/, async (ctx) => {
    const supabase = getSupabase();
    if (!supabase) return;
    const pid = rk(ctx.match[1]);
    const change = parseInt(ctx.match[2]);
    const { data: p } = await supabase.from("products").select("stock_count, name, category, price_numeric, condition").eq("id", pid).single();
    if (!p) { await ctx.answerCallbackQuery("Error."); return; }
    const newStock = Math.max(0, p.stock_count + change);
    await supabase.from("products").update({ stock_count: newStock }).eq("id", pid);
    const k = sk(pid);
    const kb = new InlineKeyboard()
      .text("-1", `st:${k}:-1`).text("+1", `st:${k}:1`).row()
      .text("-5", `st:${k}:-5`).text("+5", `st:${k}:5`).row()
      .text("🔢 Set Exact", `sx:${k}`).row()
      .text("⬅️ Back", `ct:${p.category}`).text("✅ Done", "dm");
    const msg = `<b>${esc(p.name)}</b>\nCategory: ${p.category}\nCondition: ${p.condition}\nStock: <b>${newStock}</b>\nPrice: ₦${p.price_numeric?.toLocaleString()}`;
    try {
      await ctx.editMessageCaption({ caption: msg, parse_mode: "HTML", reply_markup: kb });
    } catch {
      await ctx.editMessageText(msg, { parse_mode: "HTML", reply_markup: kb });
    }
    await ctx.answerCallbackQuery(`Stock → ${newStock}`);
  });

  bot.callbackQuery(/^sx:(.+)$/, async (ctx) => {
    const state = getState(ctx.from!.id);
    state.step = "stock_exact";
    state.stockProductId = rk(ctx.match[1]);
    await ctx.answerCallbackQuery("Send the number.");
    await ctx.reply("🔢 Send exact stock count:");
  });

  bot.callbackQuery("dm", async (ctx) => {
    await ctx.deleteMessage();
    await ctx.reply("✅ Done! /manage to continue.");
  });

  // ── BANNER ADS ──
  bot.command("ads", async (ctx) => {
    const state = getState(ctx.from!.id);
    state.step = "ad_photo";
    state.adData = {};
    await ctx.reply("📢 <b>Create Banner</b>\n\nStep 1/3: Send the photo.", { parse_mode: "HTML" });
  });

  bot.command("manage_ads", async (ctx) => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data: banners } = await supabase.from("banners").select("*").order("created_at", { ascending: false });
    if (!banners?.length) { await ctx.reply("No banners. /ads to create."); return; }
    for (const b of banners) {
      const bk = sk(b.id);
      const kb = new InlineKeyboard()
        .text(b.is_active ? "🔴 Deactivate" : "🟢 Activate", `ta:${bk}:${b.is_active}`).row()
        .text("🗑️ Delete", `da:${bk}`);
      const status = b.is_active ? "✅ Active" : "❌ Inactive";
      const caption = `<b>${esc(b.title || "Untitled")}</b>\nStatus: ${status}\nURL: ${b.link_url || "None"}`;
      if (b.image_url) {
        await ctx.replyWithPhoto(b.image_url, { caption, reply_markup: kb, parse_mode: "HTML" });
      } else {
        await ctx.reply(caption, { reply_markup: kb, parse_mode: "HTML" });
      }
    }
  });

  bot.callbackQuery(/^ta:(.+):(.+)$/, async (ctx) => {
    const supabase = getSupabase();
    if (!supabase) return;
    const bid = rk(ctx.match[1]);
    const newStatus = ctx.match[2] !== "true";
    await supabase.from("banners").update({ is_active: newStatus }).eq("id", bid);
    const bk = sk(bid);
    const kb = new InlineKeyboard()
      .text(newStatus ? "🔴 Deactivate" : "🟢 Activate", `ta:${bk}:${newStatus}`).row()
      .text("🗑️ Delete", `da:${bk}`);
    try {
      const caption = ctx.callbackQuery.message?.caption || "";
      const updated = caption.replace(/Status: (✅ Active|❌ Inactive)/, `Status: ${newStatus ? "✅ Active" : "❌ Inactive"}`);
      await ctx.editMessageCaption({ caption: updated, reply_markup: kb, parse_mode: "HTML" });
    } catch { /* ignore edit errors */ }
    await ctx.answerCallbackQuery(`Banner ${newStatus ? "on" : "off"}`);
  });

  bot.callbackQuery(/^da:(.+)$/, async (ctx) => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.from("banners").delete().eq("id", rk(ctx.match[1]));
    await ctx.deleteMessage();
    await ctx.answerCallbackQuery("Deleted.");
  });

  // ── VARIATIONS ──
  bot.command("variations", async (ctx) => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data: products } = await supabase.from("products").select("id, name").order("created_at", { ascending: false });
    if (!products?.length) { await ctx.reply("No products. /add first."); return; }
    const kb = new InlineKeyboard();
    products.forEach((p) => kb.text(trunc(p.name), `vs:${sk(p.id)}`).row());
    await ctx.reply("📦 Select product:", { reply_markup: kb });
  });

  bot.callbackQuery(/^vs:(.+)$/, async (ctx) => {
    const supabase = getSupabase();
    if (!supabase) return;
    const pid = rk(ctx.match[1]);
    const { data: vars } = await supabase.from("product_variations").select("*").eq("product_id", pid);
    const { data: prod } = await supabase.from("products").select("name").eq("id", pid).single();
    let msg = `<b>${esc(prod?.name || pid)}</b> — Variations:\n\n`;
    if (!vars?.length) { msg += "<i>None yet</i>\n"; }
    else { for (const v of vars) msg += `• <b>${esc(v.name)}</b> — ₦${v.price_numeric?.toLocaleString()} (Stock: ${v.stock_count})\n`; }
    const pk = sk(pid);
    const kb = new InlineKeyboard().text("➕ Add Variation", `va:${pk}`).row();
    if (vars?.length) { for (const v of vars) kb.text(`🗑️ ${trunc(v.name, 30)}`, `vd:${sk(v.id)}:${pk}`).row(); }
    await ctx.editMessageText(msg, { reply_markup: kb, parse_mode: "HTML" });
  });

  bot.callbackQuery(/^va:(.+)$/, async (ctx) => {
    const state = getState(ctx.from!.id);
    state.step = "var_name";
    state.varProductId = rk(ctx.match[1]);
    await ctx.editMessageText("Send variation name (e.g. <b>256GB Space Black</b>):", { parse_mode: "HTML" });
  });

  bot.callbackQuery(/^vd:(.+):(.+)$/, async (ctx) => {
    const supabase = getSupabase();
    if (!supabase) return;
    const vid = rk(ctx.match[1]);
    const pid = rk(ctx.match[2]);
    await supabase.from("product_variations").delete().eq("id", vid);
    await ctx.answerCallbackQuery("Deleted");
    const { data: vars } = await supabase.from("product_variations").select("*").eq("product_id", pid);
    const { data: prod } = await supabase.from("products").select("name").eq("id", pid).single();
    let msg = `<b>${esc(prod?.name || pid)}</b> — Variations:\n\n`;
    if (!vars?.length) { msg += "<i>None yet</i>\n"; }
    else { for (const v of vars) msg += `• <b>${esc(v.name)}</b> — ₦${v.price_numeric?.toLocaleString()} (Stock: ${v.stock_count})\n`; }
    const pk = sk(pid);
    const kb = new InlineKeyboard().text("➕ Add Variation", `va:${pk}`).row();
    if (vars?.length) { for (const v of vars) kb.text(`🗑️ ${trunc(v.name, 30)}`, `vd:${sk(v.id)}:${pk}`).row(); }
    await ctx.editMessageText(msg, { reply_markup: kb, parse_mode: "HTML" });
  });

  // ── PRODUCT REQUESTS ──
  bot.command("requests", async (ctx) => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data: requests } = await supabase.from("requests").select("*").order("created_at", { ascending: false }).limit(10);
    if (!requests?.length) { await ctx.reply("No requests yet."); return; }
    let msg = "📋 <b>Product Requests</b>\n\n";
    for (const r of requests) {
      const date = new Date(r.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
      msg += `📱 <b>${esc(r.product_name)}</b>${r.category ? ` (${r.category})` : ""}\n   👤 ${esc(r.customer_name || "Anon")}${r.customer_phone ? ` — ${r.customer_phone}` : ""}\n${r.message ? `   💬 ${esc(r.message)}\n` : ""}   📅 ${date}\n\n`;
    }
    await ctx.reply(msg, { parse_mode: "HTML" });
  });

  // ── ORDER STATUS ──
  bot.command("update_order", async (ctx) => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data: orders } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(10);
    if (!orders?.length) { await ctx.reply("No orders."); return; }
    const kb = new InlineKeyboard();
    for (const o of orders) {
      const e = o.status === "pending" ? "🟡" : o.status === "confirmed" ? "🟢" : "✅";
      kb.text(`${e} ${trunc(o.product_name, 30)}`, `os:${sk(o.id)}:${o.status}`).row();
    }
    await ctx.reply("📊 <b>Select order to update:</b>", { reply_markup: kb, parse_mode: "HTML" });
  });

  bot.callbackQuery(/^os:(.+):(.+)$/, async (ctx) => {
    const oid = rk(ctx.match[1]);
    const cur = ctx.match[2];
    const next: Record<string, string[]> = { pending: ["confirmed", "delivered"], confirmed: ["delivered", "pending"], delivered: ["pending"] };
    const kb = new InlineKeyboard();
    for (const s of (next[cur] || ["pending"])) {
      const e = s === "pending" ? "🟡" : s === "confirmed" ? "🟢" : "✅";
      kb.text(`${e} ${s.charAt(0).toUpperCase() + s.slice(1)}`, `so:${sk(oid)}:${s}`).row();
    }
    await ctx.editMessageText(`Current: <b>${cur}</b>\nSelect new status:`, { reply_markup: kb, parse_mode: "HTML" });
  });

  bot.callbackQuery(/^so:(.+):(.+)$/, async (ctx) => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.from("orders").update({ status: ctx.match[2] }).eq("id", rk(ctx.match[1]));
    await ctx.editMessageText(`✅ Status → <b>${ctx.match[2]}</b>`, { parse_mode: "HTML" });
    await ctx.answerCallbackQuery(`→ ${ctx.match[2]}`);
  });

  // ── PHOTO HANDLER ──
  bot.on("message:photo", async (ctx) => {
    const state = getState(ctx.from!.id);
    const photo = ctx.message.photo[ctx.message.photo.length - 1];

    if (state.step === "ad_photo") {
      const url = await uploadPhoto("banner-images", photo.file_id, bot!);
      if (!url) { await ctx.reply("❌ Upload failed."); return; }
      state.adData.image_url = url;
      state.step = "ad_title";
      await ctx.reply("✅ Photo uploaded!\n\nStep 2/3: Send the banner title.");
      return;
    }

    if (state.step === "add_photo" || state.step === "add_more_photos") {
      const url = await uploadPhoto("product-images", photo.file_id, bot!);
      if (!url) { await ctx.reply("❌ Upload failed."); return; }
      if (!state.productData.images) state.productData.images = [];
      state.productData.images.push(url);
      state.step = "add_more_photos";
      const kb = new InlineKeyboard().text("✅ Done — Save Product", "save_product");
      await ctx.reply(`📸 Photo ${state.productData.images.length} added! Send more or tap Done.`, { reply_markup: kb });
      return;
    }

    if (state.step === "edit_value" && state.editField === "image") {
      const url = await uploadPhoto("product-images", photo.file_id, bot!);
      if (!url) { await ctx.reply("❌ Upload failed."); return; }
      const supabase = getSupabase();
      if (supabase && state.editProductId) {
        await supabase.from("products").update({ image_url: url }).eq("id", state.editProductId);
        await ctx.reply("✅ Image updated! /edit to continue.");
      }
      userStates.set(ctx.from!.id, defaultState());
      return;
    }
  });

  // ── SAVE PRODUCT ──
  bot.callbackQuery("save_product", async (ctx) => {
    const state = getState(ctx.from!.id);
    const supabase = getSupabase();
    if (!supabase) return;
    const pd = state.productData;
    if (!pd.name || !pd.category || !pd.condition || !pd.price || !pd.description || !pd.images?.length) {
      await ctx.answerCallbackQuery("Missing data. /add to restart.");
      return;
    }
    const slug = pd.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { error } = await supabase.from("products").insert({
      id: slug, name: pd.name, category: pd.category, condition: pd.condition,
      price_numeric: pd.price, description: pd.description, image_url: pd.images[0],
      stock_count: 0, specs: [], is_deal: false,
    });
    if (error) {
      await ctx.answerCallbackQuery("Failed.");
      await ctx.reply(`❌ ${error.message}`);
      userStates.set(ctx.from!.id, defaultState());
      return;
    }
    if (pd.images.length > 0) {
      await supabase.from("product_images").insert(
        pd.images.map((url, i) => ({ product_id: slug, image_url: url, display_order: i }))
      );
    }
    await ctx.editMessageText(
      `✅ <b>${esc(pd.name)}</b> saved!\n\nCategory: ${pd.category}\nCondition: ${pd.condition}\nPrice: ₦${pd.price.toLocaleString()}\nImages: ${pd.images.length}\nStock: 0 (use /manage)`,
      { parse_mode: "HTML" }
    );
    userStates.set(ctx.from!.id, defaultState());
  });

  // ── TEXT HANDLER ──
  bot.on("message:text", async (ctx) => {
    const state = getState(ctx.from!.id);
    const text = ctx.message.text.trim();

    // Variation name
    if (state.step === "var_name" && state.varProductId) {
      state.varName = text;
      state.step = "var_price";
      await ctx.reply("Send price (numbers only, e.g. 950000):");
      return;
    }

    // Variation price
    if (state.step === "var_price" && state.varProductId) {
      const price = parseInt(text.replace(/\D/g, ""));
      if (isNaN(price) || price <= 0) { await ctx.reply("Send a valid price."); return; }
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from("product_variations").insert({
          product_id: state.varProductId, name: state.varName, price_numeric: price, stock_count: 0,
        });
        await ctx.reply(`✅ <b>${esc(state.varName || "")}</b> added at ₦${price.toLocaleString()}!\n\n/variations to manage more.`, { parse_mode: "HTML" });
      }
      userStates.set(ctx.from!.id, defaultState());
      return;
    }

    // Stock exact
    if (state.step === "stock_exact" && state.stockProductId) {
      const count = parseInt(text);
      if (isNaN(count) || count < 0) { await ctx.reply("Send a valid number (0+)."); return; }
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from("products").update({ stock_count: count }).eq("id", state.stockProductId);
        await ctx.reply(`✅ Stock set to <b>${count}</b>. /manage to continue.`, { parse_mode: "HTML" });
      }
      userStates.set(ctx.from!.id, defaultState());
      return;
    }

    // Edit value
    if (state.step === "edit_value" && state.editProductId && state.editField) {
      const supabase = getSupabase();
      if (!supabase) return;
      if (state.editField === "price") {
        const num = parseInt(text.replace(/\D/g, ""));
        if (isNaN(num)) { await ctx.reply("Send a valid number."); return; }
        await supabase.from("products").update({ price_numeric: num }).eq("id", state.editProductId);
      } else {
        await supabase.from("products").update({ [state.editField]: text }).eq("id", state.editProductId);
      }
      await ctx.reply(`✅ ${state.editField} updated! /edit to continue.`);
      userStates.set(ctx.from!.id, defaultState());
      return;
    }

    // Banner title
    if (state.step === "ad_title") {
      state.adData.title = text;
      state.step = "ad_url";
      await ctx.reply("Step 3/3: Send the link URL (e.g. /browse or https://...)");
      return;
    }

    // Banner URL
    if (state.step === "ad_url") {
      const supabase = getSupabase();
      if (!supabase) return;
      await supabase.from("banners").insert({
        image_url: state.adData.image_url, link_url: text, title: state.adData.title || null, is_active: true,
      });
      await ctx.reply("✅ Banner created! /manage_ads to view.");
      userStates.set(ctx.from!.id, defaultState());
      return;
    }

    // Add product: name
    if (state.step === "add_name") {
      state.productData.name = text;
      state.step = "add_category";
      const kb = new InlineKeyboard()
        .text("📱 Phones", "nc:Phones").text("💻 Laptops", "nc:Laptops").row()
        .text("🎧 Accessories", "nc:Accessories");
      await ctx.reply(`Step 2/6: Category for <b>${esc(text)}</b>:`, { reply_markup: kb, parse_mode: "HTML" });
      return;
    }

    // Add product: price
    if (state.step === "add_price") {
      const num = parseInt(text.replace(/\D/g, ""));
      if (isNaN(num) || num <= 0) { await ctx.reply("Send a valid price."); return; }
      state.productData.price = num;
      state.step = "add_description";
      await ctx.reply("Step 5/6: Short description.\n\n<i>e.g. Premium UK used, 256GB, 95% battery</i>", { parse_mode: "HTML" });
      return;
    }

    // Add product: description
    if (state.step === "add_description") {
      state.productData.description = text;
      state.step = "add_photo";
      await ctx.reply("Step 6/6: Send product photos 📸\n\nFirst photo = main image. You can send multiple.");
      return;
    }
  });

  // Add product callbacks
  bot.callbackQuery(/^nc:(.+)$/, async (ctx) => {
    const state = getState(ctx.from!.id);
    state.productData.category = ctx.match[1];
    state.step = "add_condition";
    const kb = new InlineKeyboard()
      .text("Brand New", "nd:Brand New").row()
      .text("UK Used", "nd:UK Used").row()
      .text("Nigerian Used", "nd:Nigerian Used");
    await ctx.editMessageText("Step 3/6: Condition:", { reply_markup: kb });
  });

  bot.callbackQuery(/^nd:(.+)$/, async (ctx) => {
    const state = getState(ctx.from!.id);
    state.productData.condition = ctx.match[1];
    state.step = "add_price";
    await ctx.editMessageText("Step 4/6: Send the price (numbers only, e.g. 850000):");
  });

  // ── PREVIEW ──
  bot.command("preview", async (ctx) => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data: products } = await supabase.from("products").select("id, name, image_url").order("created_at", { ascending: false });
    if (!products?.length) { await ctx.reply("No products."); return; }
    const kb = new InlineKeyboard();
    products.forEach((p) => kb.text(trunc(p.name), `pv:${sk(p.id)}`).row());
    await ctx.reply("👁️ Select product to preview:", { reply_markup: kb });
  });

  bot.callbackQuery(/^pv:(.+)$/, async (ctx) => {
    const supabase = getSupabase();
    if (!supabase) return;
    const pid = rk(ctx.match[1]);
    const { data: p } = await supabase.from("products").select("*").eq("id", pid).single();
    if (!p) { await ctx.answerCallbackQuery("Not found."); return; }
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.chimee.ng";
    const url = `${siteUrl}/product/${p.id}`;
    const msg =
      `👁️ <b>Preview: ${esc(p.name)}</b>\n\n` +
      `📂 ${p.category} · ${p.condition}\n` +
      `💰 ₦${p.price_numeric?.toLocaleString()}\n` +
      `📦 Stock: ${p.stock_count}\n` +
      `🔥 Deal: ${p.is_deal ? "Yes" : "No"}\n\n` +
      `🔗 <a href="${url}">${url}</a>`;
    await ctx.deleteMessage();
    if (p.image_url) {
      await ctx.replyWithPhoto(p.image_url, { caption: msg, parse_mode: "HTML" });
    } else {
      await ctx.reply(msg, { parse_mode: "HTML", link_preview_options: { is_disabled: false } });
    }
  });

  // ── ERROR HANDLING ──
  bot.catch((err) => { console.error("Bot Error:", err); });
}
