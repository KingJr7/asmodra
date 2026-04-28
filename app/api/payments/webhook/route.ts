import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireServerEnv } from "@/lib/env";
import { constantTimeEqual, signHmacSha256 } from "@/lib/security";
import { activateSuccessfulPurchase } from "@/lib/purchases";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function readNested(record: Record<string, unknown> | null, ...path: string[]) {
  let current: unknown = record;
  for (const key of path) {
    const next = asRecord(current);
    if (!next) {
      return null;
    }
    current = next[key];
  }
  return current ?? null;
}

function resolveReference(payload: Record<string, unknown>) {
  return (
    readNested(payload, "data", "id") ??
    readNested(payload, "data", "payment_intent_id") ??
    readNested(payload, "data", "intent", "id") ??
    readNested(payload, "data", "charge", "payment_intent_id") ??
    payload.id ??
    null
  );
}

async function activatePlanFromReference(reference: string, payload: Record<string, unknown>) {
  const admin = createAdminClient();
  const { data: payment } = await admin
    .from("payment_transactions")
    .select("*")
    .eq("provider_reference", reference)
    .single();

  if (!payment) {
    return;
  }

  await activateSuccessfulPurchase(payment, payload, "webhook");
}

export async function POST(request: Request) {
  const env = requireServerEnv();
  const signature = request.headers.get("x-yabetoo-signature");
  const rawBody = await request.text();
  const secret = env.YABETOO_WEBHOOK_SECRET ?? env.YABETOO_SECRET_KEY;

  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 401 });
  }

  const expected = signHmacSha256(rawBody, secret);

  if (!constantTimeEqual(signature, expected)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as Record<string, unknown>;
  const eventTypeRaw = payload.type ?? payload.event ?? "unknown";
  const eventType = typeof eventTypeRaw === "string" ? eventTypeRaw : "unknown";
  const referenceRaw = resolveReference(payload);
  const reference = typeof referenceRaw === "string" ? referenceRaw : null;
  const admin = createAdminClient();

  await admin.from("webhook_events").insert({
    provider: "yabetoo",
    event_type: eventType,
    reference,
    payload,
  });

  if (!reference) {
    return NextResponse.json({ received: true });
  }

  if (
    ["intent.completed", "intent.succeeded", "payment_intent.succeeded"].includes(eventType)
  ) {
    await activatePlanFromReference(reference, payload);
  }

  if (
    ["intent.failed", "payment_intent.payment_failed", "intent.expired", "payment_intent.canceled"].includes(
      eventType,
    )
  ) {
    await admin
      .from("payment_transactions")
      .update({
        status: eventType.includes("expired") ? "expired" : "failed",
        raw_payload: payload,
      })
      .eq("provider_reference", reference);
  }

  return NextResponse.json({ received: true });
}
