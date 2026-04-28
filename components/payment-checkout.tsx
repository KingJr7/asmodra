"use client";

import { useState } from "react";
import styles from "./forms.module.css";
import type { PlanId, StoreItemId } from "@/lib/plans";

type PaymentPlan = {
  id: StoreItemId;
  name: string;
  amountXaf: number;
  monthlyQuota: number;
  description: string;
  watermark: boolean;
  kind?: "plan" | "credit_pack";
};

type PaymentCheckoutProps = {
  plans: PaymentPlan[];
  currentPlanId?: PlanId;
  disabled?: boolean;
};

export function PaymentCheckout({ plans, currentPlanId, disabled = false }: PaymentCheckoutProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<StoreItemId>(
    plans.find((plan) => plan.id === currentPlanId)?.id ?? plans[0]?.id ?? "pro",
  );
  const [paymentMeta, setPaymentMeta] = useState<null | {
    reference?: string;
    status?: string;
  }>(null);
  const selectedPlan = plans.find((plan) => plan.id === selectedPlanId) ?? plans[0];

  function normalizePaymentError(message: string) {
    if (message.includes("Operateur non reconnu")) {
      return "Numero invalide ou operateur non pris en charge. Utilise un numero MTN ou Airtel Congo.";
    }

    if (message.includes("YABETOO_ERROR")) {
      return "Le prestataire de paiement a refuse ou interrompu la demande.";
    }

    if (message.includes("Supabase")) {
      return "La plateforme n'est pas encore configuree completement.";
    }

    return message;
  }

  async function handleSubmit(formData: FormData) {
    setMessage("");
    setError("");
    setPaymentMeta(null);
    setLoading(true);

    const response = await fetch("/api/payments/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        planId: selectedPlanId,
        phone: formData.get("phone"),
        firstName: formData.get("first_name"),
        lastName: formData.get("last_name"),
      }),
    });

    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(normalizePaymentError(payload.error ?? "Le paiement n'a pas pu etre lance."));
      return;
    }

    setMessage(payload.message ?? "Push USSD envoye.");
    setPaymentMeta({
      reference: payload.reference,
      status: payload.status,
    });
  }

  return (
    <form className={`${styles.panel} ${styles.stack}`} action={handleSubmit}>
      <div className={styles.planPicker}>
        {plans.map((plan) => {
          const selected = plan.id === selectedPlanId;
          const isCurrent = currentPlanId === plan.id;
          const itemKind = plan.kind ?? "plan";

          return (
            <button
              key={plan.id}
              type="button"
              className={`${styles.planOption} ${selected ? styles.planOptionActive : ""}`}
              onClick={() => setSelectedPlanId(plan.id)}
              disabled={disabled || loading}
            >
              <div className={styles.planOptionTop}>
                <strong>{plan.name}</strong>
                {isCurrent ? <span className={styles.planBadge}>offre actuelle</span> : null}
              </div>
              <p className={styles.planPrice}>
                {plan.amountXaf.toLocaleString("fr-FR")} FCFA
                <span>{itemKind === "plan" ? "/ mois" : " en une fois"}</span>
              </p>
              <p className={styles.hint}>
                {plan.monthlyQuota} {itemKind === "plan" ? "credits / mois" : "credits en plus"}
              </p>
              <p className={styles.hint}>{plan.description}</p>
              <span className={styles.planFoot}>
                {itemKind === "plan"
                  ? plan.watermark
                    ? "avec signature Asmodra"
                    : "sans signature"
                  : "s'ajoute a ton solde, avec ou sans abonnement"}
              </span>
            </button>
          );
        })}
      </div>

      <div className={styles.banner}>
        <strong>{selectedPlan?.name}</strong>
        <p className={styles.hint}>
          Choix actuel: {selectedPlan?.amountXaf.toLocaleString("fr-FR")} FCFA
          {selectedPlan?.kind === "credit_pack" ? " en une fois" : " par mois"} pour{" "}
          {selectedPlan?.monthlyQuota}{" "}
          {selectedPlan?.kind === "credit_pack" ? "credits en plus" : "credits"}.
        </p>
        {selectedPlan?.kind === "credit_pack" ? (
          <p className={styles.hint}>
            Ce pack s&apos;ajoute a ton solde disponible et peut etre utilise meme sans offre mensuelle payante.
          </p>
        ) : null}
      </div>

      <div className={styles.row}>
        <div>
          <label className={styles.label} htmlFor="payment-first-name">
            Prenom
          </label>
          <input
            id="payment-first-name"
            name="first_name"
            className={styles.input}
            required
            disabled={disabled || loading}
          />
        </div>
        <div>
          <label className={styles.label} htmlFor="payment-last-name">
            Nom
          </label>
          <input
            id="payment-last-name"
            name="last_name"
            className={styles.input}
            required
            disabled={disabled || loading}
          />
        </div>
      </div>

      <div>
        <label className={styles.label} htmlFor="payment-phone">
          Numero MTN / Airtel
        </label>
        <input
          id="payment-phone"
          name="phone"
          className={styles.input}
          placeholder="+242..."
          required
          disabled={disabled || loading}
        />
      </div>

      <p className={styles.hint}>
        Tu recevras une demande de paiement sur ton telephone pour valider cette offre.
      </p>

      {error ? <p className={styles.error}>{error}</p> : null}
      {message ? <p className={styles.success}>{message}</p> : null}
      {paymentMeta?.reference ? (
        <p className={styles.hint}>
          Reference: {paymentMeta.reference}. Etat:{" "}
          {paymentMeta.status ?? "en cours"}.
        </p>
      ) : null}

      <div className={styles.actions}>
        <button className={styles.button} type="submit" disabled={disabled || loading}>
          {loading ? "Demande en cours..." : "Payer par Mobile Money"}
        </button>
      </div>
    </form>
  );
}
