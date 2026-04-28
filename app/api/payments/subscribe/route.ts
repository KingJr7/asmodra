import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStoreItemDefinition } from "@/lib/plans";
import { detectOperator, formatMsisdn, createPaymentIntent, confirmPaymentIntent } from "@/lib/yabetoo";
import { enforceRateLimit, sanitizeText } from "@/lib/security";

const paymentSchema = z.object({
  planId: z.enum(["pro", "business", "credits_5", "credits_35", "credits_80", "credits_180"]),
  phone: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase n'est pas configure." },
        { status: 503 },
      );
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
    }

    enforceRateLimit(`payment:${user.id}`, 5, 15 * 60 * 1000);

    const body = await request.json();
    const parsed = paymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Donnees de paiement invalides." }, { status: 400 });
    }

    const item = getStoreItemDefinition(parsed.data.planId);

    if (!item || item.amountXaf <= 0) {
      return NextResponse.json({ error: "Choix d'achat invalide." }, { status: 400 });
    }

    const msisdn = formatMsisdn(sanitizeText(parsed.data.phone));
    const operatorName = detectOperator(msisdn);

    if (!operatorName) {
      return NextResponse.json(
        { error: "Operateur non reconnu. Utilise un numero MTN ou Airtel Congo." },
        { status: 400 },
      );
    }

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
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const confirmation = await confirmPaymentIntent({
      intentId: intent.id,
      clientSecret: intent.client_secret,
      firstName: sanitizeText(parsed.data.firstName),
      lastName: sanitizeText(parsed.data.lastName),
      msisdn,
      operatorName,
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

    return NextResponse.json({
      message:
        item.kind === "plan"
          ? "Demande envoyee. Valide maintenant le paiement sur ton telephone pour activer ton offre."
          : "Demande envoyee. Valide maintenant le paiement sur ton telephone pour ajouter tes credits.",
      reference: intent.id,
      status: "processing",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Paiement impossible.",
      },
      { status: 500 },
    );
  }
}
