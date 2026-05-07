import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStoreItemDefinition } from "@/lib/plans";
import {
  detectOperator,
  formatMsisdn,
  createPaymentIntent,
  confirmPaymentIntent,
  getPaymentIntent,
} from "@/lib/yabetoo";
import { enforceRateLimit, sanitizeText } from "@/lib/security";
import { activateSuccessfulPurchase } from "@/lib/purchases";

const paymentSchema = z.object({
  planId: z.enum([
    "pro",
    "business",
    "credits_pack_oneshot",
    "credits_topup",
    "credits_pack_small",
    "credits_pack_medium",
    "credits_pack_large",
  ]),
  phone: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
});

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  try {
    console.info("[payments/subscribe] start", { requestId });
    const supabase = await createClient();
    if (!supabase) {
      console.error("[payments/subscribe] supabase_not_configured", { requestId });
      return NextResponse.json(
        { error: "Supabase n'est pas configure." },
        { status: 503 },
      );
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn("[payments/subscribe] unauthenticated", { requestId });
      return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
    }

    enforceRateLimit(`payment:${user.id}`, 5, 15 * 60 * 1000);

    const body = await request.json();
    const parsed = paymentSchema.safeParse(body);

    if (!parsed.success) {
      console.warn("[payments/subscribe] invalid_payload", {
        requestId,
        issues: parsed.error.issues.map((issue) => issue.path.join(".")),
      });
      return NextResponse.json({ error: "Donnees de paiement invalides." }, { status: 400 });
    }

    const item = getStoreItemDefinition(parsed.data.planId);

    if (!item || item.amountXaf <= 0) {
      console.warn("[payments/subscribe] invalid_item", {
        requestId,
        planId: parsed.data.planId,
      });
      return NextResponse.json({ error: "Choix d'achat invalide." }, { status: 400 });
    }

    const msisdn = formatMsisdn(sanitizeText(parsed.data.phone));
    const operatorName = detectOperator(msisdn);

    if (!operatorName) {
      console.warn("[payments/subscribe] unsupported_operator", { requestId, msisdn });
      return NextResponse.json(
        { error: "Operateur non reconnu. Utilise un numero MTN ou Airtel Congo." },
        { status: 400 },
      );
    }

    console.info("[payments/subscribe] create_intent", {
      requestId,
      userId: user.id,
      itemId: item.id,
      amountXaf: item.amountXaf,
      operatorName,
    });

    const intent = await createPaymentIntent({
      amount: item.amountXaf,
      description:
        item.kind === "plan"
          ? `Abonnement ${item.name} Asmodra`
          : `${item.name} Asmodra`,
      metadata: {
        user_id: user.id,
        plan_id: item.id,
        purchase_kind: item.kind,
      },
    });

    console.info("[payments/subscribe] intent_created", {
      requestId,
      intentId: intent.id,
      intentStatus: intent.status,
    });

    const admin = createAdminClient();
    const { error: insertError } = await admin.from("payment_transactions").insert({
      user_id: user.id,
      plan_id: item.id,
      provider: "yabetoo",
      provider_reference: intent.id,
      status: "pending",
      amount_xaf: item.amountXaf,
      currency: "xaf",
      msisdn,
      operator_name: operatorName,
      raw_payload: { intent },
    });

    if (insertError) {
      console.error("[payments/subscribe] payment_insert_failed", {
        requestId,
        message: insertError.message,
      });
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    console.info("[payments/subscribe] confirm_intent", {
      requestId,
      intentId: intent.id,
    });

    const confirmation = await confirmPaymentIntent({
      intentId: intent.id,
      clientSecret: intent.client_secret,
      firstName: sanitizeText(parsed.data.firstName),
      lastName: sanitizeText(parsed.data.lastName),
      msisdn,
      operatorName,
    });

    console.info("[payments/subscribe] intent_confirmed", {
      requestId,
      intentId: intent.id,
      confirmationType: typeof confirmation,
    });

    await admin
      .from("payment_transactions")
      .update({
        status: "processing",
        raw_payload: {
          intent,
          confirmation,
        },
      })
      .eq("provider_reference", intent.id);

    const providerState = await getPaymentIntent(intent.id);
    const providerStatus =
      typeof providerState?.status === "string" ? providerState.status : "unknown";
    console.info("[payments/subscribe] provider_status_after_confirm", {
      requestId,
      intentId: intent.id,
      providerStatus,
    });

    let activated = false;

    if (providerStatus === "succeeded" || providerStatus === "completed") {
      const { data: paymentRecord } = await admin
        .from("payment_transactions")
        .select("*")
        .eq("provider_reference", intent.id)
        .single();

      if (paymentRecord) {
        await activateSuccessfulPurchase(paymentRecord, providerState, "reconcile");
        activated = true;
        console.info("[payments/subscribe] activated_via_fallback", {
          requestId,
          intentId: intent.id,
        });
      }
    }

    console.info("[payments/subscribe] success", {
      requestId,
      intentId: intent.id,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json({
      message:
        activated
          ? item.kind === "plan"
            ? "Paiement confirme. Ton offre est active."
            : "Paiement confirme. Tes credits ont ete ajoutes."
          : item.kind === "plan"
            ? "Demande envoyee. Valide maintenant le paiement sur ton telephone pour activer ton offre."
            : "Demande envoyee. Valide maintenant le paiement sur ton telephone pour ajouter tes credits.",
      reference: intent.id,
      status: activated ? "paid" : "processing",
      activated,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "RATE_LIMITED") {
      console.warn("[payments/subscribe] rate_limited", {
        requestId,
        durationMs: Date.now() - startedAt,
      });
      return NextResponse.json(
        { error: "Trop de tentatives de paiement. Réessaie dans quelques minutes." },
        { status: 429 },
      );
    }

    const message =
      error instanceof Error
        ? error.name === "TimeoutError"
          ? "Le service de paiement ne repond pas. Reessaie dans quelques secondes."
          : error.message
        : "Paiement impossible.";

    console.error("[payments/subscribe] failure", {
      requestId,
      durationMs: Date.now() - startedAt,
      errorName: error instanceof Error ? error.name : "unknown",
      message,
    });

    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 },
    );
  }
}
