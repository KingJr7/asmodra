import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireServerEnv } from "@/lib/env";
import { getPaymentIntent } from "@/lib/yabetoo";
import { activateSuccessfulPurchase } from "@/lib/purchases";

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
      await activateSuccessfulPurchase(payment, providerState, "reconcile");
    }

    results.push({
      reference: payment.provider_reference,
      providerStatus: status,
    });
  }

  return NextResponse.json({ reconciled: results.length, results });
}
