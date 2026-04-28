import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSupabasePublicEnv } from "@/lib/env";
import { activateSuccessfulPurchase } from "@/lib/purchases";
import { getPaymentIntent } from "@/lib/yabetoo";

export async function POST() {
  if (!hasSupabasePublicEnv()) {
    return NextResponse.json({ error: "Supabase n'est pas configure." }, { status: 503 });
  }

  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase n'est pas configure." }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const { data: actor } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: "user" | "admin" }>();

  if (actor?.role !== "admin") {
    return NextResponse.json({ error: "Acces admin requis." }, { status: 403 });
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

  return NextResponse.json({
    message: `${results.length} transaction(s) reconciliee(s).`,
    results,
  });
}
