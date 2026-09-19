import { webhookCallback } from "grammy";
import { bot } from "@/lib/bot";

const WEBHOOK_SECRET = "chimee_webhook_secret_2026";

export const POST = async (req: Request) => {
  try {
    if (!bot) {
      return new Response(JSON.stringify({ error: "Bot not initialized" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify Telegram webhook secret
    const secretHeader = req.headers.get("x-telegram-bot-api-secret-token");
    if (secretHeader !== WEBHOOK_SECRET) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return await webhookCallback(bot, "std/http")(req);
  } catch (error) {
    console.error("Error in Telegram Bot API route:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
