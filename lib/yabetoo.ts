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
  const response = await fetch(`${getYabetooBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.YABETOO_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(
      `YABETOO_ERROR:${response.status}:${
        typeof data === "object" ? JSON.stringify(data) : text
      }`,
    );
  }

  return data as T;
}

export async function createPaymentIntent(input: {
  amount: number;
  description: string;
  metadata: Record<string, unknown>;
}) {
  return yabetooFetch<{
    id: string;
    client_secret: string;
    status: string;
  }>("/v1/payment-intents", {
    method: "POST",
    body: JSON.stringify({
      amount: input.amount,
      currency: "xaf",
      description: input.description,
      metadata: input.metadata,
    }),
  });
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
  return yabetooFetch(`/v1/payment-intents/${intentId}`, {
    method: "GET",
  });
}
