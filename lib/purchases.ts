import { createAdminClient } from "@/lib/supabase/admin";
import { CREDIT_PACK_DEFINITIONS } from "@/lib/plans";
import { sendTelegramSaleAlert } from "@/lib/telegram";
import type { PaymentRecord } from "@/lib/types";

function resolvePurchaseKind(payment: Pick<PaymentRecord, "plan_id" | "purchase_kind">) {
  if (payment.purchase_kind === "credit_pack") {
    return "credit_pack" as const;
  }

  if (payment.purchase_kind === "plan") {
    return "plan" as const;
  }

  return payment.plan_id in CREDIT_PACK_DEFINITIONS ? "credit_pack" : "plan";
}

function resolveMetadataPurchaseKind(payload: Record<string, unknown> | null) {
  const data = payload?.data;
  if (!data || typeof data !== "object") {
    return undefined;
  }

  const metadata = (data as Record<string, unknown>).metadata;
  if (!metadata || typeof metadata !== "object") {
    return undefined;
  }

  const purchaseKind = (metadata as Record<string, unknown>).purchase_kind;
  return purchaseKind === "plan" || purchaseKind === "credit_pack" ? purchaseKind : undefined;
}

export async function activateSuccessfulPurchase(
  payment: PaymentRecord,
  payload: Record<string, unknown> | null,
  source: "webhook" | "reconcile",
) {
  const admin = createAdminClient();
  const purchaseKind =
    resolvePurchaseKind(payment) ??
    resolveMetadataPurchaseKind(payload) ??
    (payment.plan_id in CREDIT_PACK_DEFINITIONS ? "credit_pack" : "plan");

  if (payment.status === "paid") {
    return { alreadyPaid: true } as const;
  }

  await admin
    .from("payment_transactions")
    .update({
      status: "paid",
      raw_payload: payload,
    })
    .eq("id", payment.id);

  if (purchaseKind === "credit_pack") {
    const pack = CREDIT_PACK_DEFINITIONS[payment.plan_id as keyof typeof CREDIT_PACK_DEFINITIONS];

    if (pack) {
      await admin.rpc("add_bonus_credits", {
        p_user_id: payment.user_id,
        p_credits: pack.credits,
      });
    }
  } else {
    const endsAt = new Date();
    endsAt.setMonth(endsAt.getMonth() + 1);

    await admin.from("profiles").update({ plan_id: payment.plan_id }).eq("id", payment.user_id);

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

  const { data: profile } = await admin
    .from("profiles")
    .select("email, business_name")
    .eq("id", payment.user_id)
    .maybeSingle<{ email: string; business_name: string | null }>();

  const saleLabel =
    purchaseKind === "credit_pack"
      ? `Pack ${payment.plan_id}`
      : `Abonnement ${payment.plan_id.toUpperCase()}`;

  const buyer = profile?.business_name || profile?.email || payment.user_id;

  try {
    await sendTelegramSaleAlert(
      [
        "Nouvelle vente Asmodra",
        `Acheteur: ${buyer}`,
        `Produit: ${saleLabel}`,
        `Montant: ${payment.amount_xaf.toLocaleString("fr-FR")} FCFA`,
        `Reference: ${payment.provider_reference ?? "n/a"}`,
        `Source: ${source}`,
        "Pense a verifier le solde OpenRouter.",
      ].join("\n"),
    );
  } catch (error) {
    console.error("[telegram] sale alert failed", error);
  }

  return { alreadyPaid: false } as const;
}
