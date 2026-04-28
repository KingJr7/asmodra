import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireServerEnv } from "@/lib/env";
import { getPaymentIntent } from "@/lib/yabetoo";
import type { PaymentRecord } from "@/lib/types";

async function activatePlan(payment: Pick<PaymentRecord, "plan_id" | "user_id" | "provider_reference">) {
  const admin = createAdminClient();
  const endsAt = new Date();
  endsAt.setMonth(endsAt.getMonth() + 1);

  await admin
    .from("profiles")
    .update({
      plan_id: payment.plan_id,
    })
    .eq("id", payment.user_id);

  await admin.from("subscriptions").upsert(
    {
      user_id: payment.user_id,
      plan_id: payment.plan_id,
      status: "active",
      started_at: new Date().toISOString(),
      ends_at: endsAt.toISOString(),
      renewed_manually: true,
      payment_reference: payment.provider_reference,
    },
    {
      onConflict: "user_id",
      ignoreDuplicates: false,
    },
  );
}

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const env = requireServerEnv();

  if (auth !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: pendingPayments, error } = await admin
    .from("payment_transactions")
    .select("*")
    .in("status", ["pending", "processing"])
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = [];

  for (const payment of pendingPayments ?? []) {
    const providerState = await getPaymentIntent(payment.provider_reference);
    const status = providerState?.status ?? "pending";

    await admin
      .from("payment_transactions")
      .update({
        status:
          status === "succeeded" || status === "completed"
            ? "paid"
            : status === "failed"
              ? "failed"
              : "processing",
        raw_payload: providerState,
      })
      .eq("id", payment.id);

    if (status === "succeeded" || status === "completed") {
      await activatePlan(payment);
    }

    results.push({
      reference: payment.provider_reference,
      providerStatus: status,
    });
  }

  return NextResponse.json({ reconciled: results.length, results });
}
