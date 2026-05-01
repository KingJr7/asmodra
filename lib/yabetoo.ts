import { requireServerEnv } from "@/lib/env";

export function getYabetooBaseUrl() {
  const env = requireServerEnv();

  if (env.NEXT_PUBLIC_YABETOO_BASE_URL) {
    return env.NEXT_PUBLIC_YABETOO_BASE_URL;
  }

  if (env.YABETOO_SECRET_KEY.includes("test")) {
    return "https://pay.sandbox.yabetoopay.com";
  }

  return "https://pay.api.yabetoopay.com";
}

export function formatMsisdn(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const local = digits.startsWith("242") ? digits.slice(3) : digits;
  const normalized = local.startsWith("0") ? local : `0${local}`;
  return `+242${normalized.replace(/^0/, "0")}`;
}

export function detectOperator(msisdn: string) {
  const local = msisdn.replace("+242", "");

  if (local.startsWith("06")) {
    return "mtn";
  }

  if (local.startsWith("04") || local.startsWith("05")) {
    return "airtel";
  }

  return null;
}

async function yabetooFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const env = requireServerEnv();
  const timeoutMs = 20_000;
  const baseUrl = getYabetooBaseUrl();
  const url = `${baseUrl}${path}`;
  const startedAt = Date.now();
  const method = init?.method ?? "GET";

  console.info("[yabetoo] request", {
    method,
    path,
    baseUrl,
    timeoutMs,
  });

  const response = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      Authorization: `Bearer ${env.YABETOO_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    console.error("[yabetoo] response_error", {
      method,
      path,
      status: response.status,
      durationMs: Date.now() - startedAt,
      bodyPreview:
        typeof data === "object" ? JSON.stringify(data).slice(0, 220) : String(data ?? "").slice(0, 220),
    });
    throw new Error(
      `YABETOO_ERROR:${response.status}:${
        typeof data === "object" ? JSON.stringify(data) : String(data ?? "")
      }`,
    );
  }

  if (typeof data === "string" && data.trim().length > 0) {
    console.error("[yabetoo] invalid_json_response", {
      method,
      path,
      status: response.status,
      durationMs: Date.now() - startedAt,
      bodyPreview: data.slice(0, 220),
    });
    throw new Error(`YABETOO_ERROR:INVALID_JSON_RESPONSE:${data.slice(0, 180)}`);
  }

  console.info("[yabetoo] response_ok", {
    method,
    path,
    status: response.status,
    durationMs: Date.now() - startedAt,
  });

  return (data ?? {}) as T;
}

export async function createPaymentIntent(input: {
  amount: number;
  description: string;
  metadata: Record<string, unknown>;
}) {
  const payload = await yabetooFetch<Record<string, unknown>>("/v1/payment-intents", {
    method: "POST",
    body: JSON.stringify({
      amount: input.amount,
      currency: "xaf",
      description: input.description,
      metadata: input.metadata,
    }),
  });

  const root = payload;
  const data =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;

  const idRaw = data.id ?? root.id;
  const statusRaw = data.status ?? root.status;
  const clientSecretRaw =
    data.client_secret ??
    data.clientSecret ??
    root.client_secret ??
    root.clientSecret ??
    (data.client && typeof data.client === "object"
      ? (data.client as Record<string, unknown>).secret
      : undefined);

  const id = typeof idRaw === "string" ? idRaw : "";
  const client_secret = typeof clientSecretRaw === "string" ? clientSecretRaw : "";
  const status = typeof statusRaw === "string" ? statusRaw : "created";

  if (!id || !client_secret) {
    throw new Error(
      `YABETOO_ERROR:INVALID_INTENT_PAYLOAD:${JSON.stringify({
        hasId: Boolean(id),
        hasClientSecret: Boolean(client_secret),
        keys: Object.keys(data),
      })}`,
    );
  }

  return {
    id,
    client_secret,
    status,
  };
}

export async function confirmPaymentIntent(input: {
  intentId: string;
  clientSecret: string;
  firstName: string;
  lastName: string;
  msisdn: string;
  operatorName: string;
}) {
  return yabetooFetch(`/v1/payment-intents/${input.intentId}/confirm`, {
    method: "POST",
    body: JSON.stringify({
      client_secret: input.clientSecret,
      first_name: input.firstName,
      last_name: input.lastName,
      payment_method_data: {
        type: "momo",
        momo: {
          country: "cg",
          msisdn: input.msisdn,
          operator_name: input.operatorName,
        },
      },
    }),
  });
}

export async function getPaymentIntent(intentId: string) {
  return yabetooFetch<{
    id?: string;
    status?: string;
    [key: string]: unknown;
  }>(`/v1/payment-intents/${intentId}`, {
    method: "GET",
  });
}
