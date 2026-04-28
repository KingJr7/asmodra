import { getServerEnv } from "@/lib/env";

export async function sendTelegramSaleAlert(message: string) {
  const parsed = getServerEnv();

  if (!parsed.success) {
    return { sent: false, reason: "env_missing" } as const;
  }

  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = parsed.data;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return { sent: false, reason: "telegram_not_configured" } as const;
  }

  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`TELEGRAM_ERROR:${response.status}:${text}`);
  }

  return { sent: true } as const;
}
