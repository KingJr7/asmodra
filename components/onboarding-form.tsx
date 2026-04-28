"use client";

import { useState } from "react";
import styles from "./forms.module.css";
import type { ProfileRecord } from "@/lib/types";

type OnboardingFormProps = {
  profile: ProfileRecord;
};

export function OnboardingForm({ profile }: OnboardingFormProps) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setSuccess("");
    setLoading(true);

    const response = await fetch("/api/profile/onboarding", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(Object.fromEntries(formData.entries())),
    });

    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Impossible de completer l'onboarding.");
      return;
    }

    setSuccess(payload.message ?? "Profil mis a jour.");

    if (payload.redirectTo) {
      window.location.href = payload.redirectTo;
    }
  }

  return (
    <form className={`${styles.panel} ${styles.stack}`} action={handleSubmit}>
      <p className={styles.hint}>
        Quelques infos simples suffisent pour mieux adapter tes prochaines affiches.
      </p>

      <div className={styles.row}>
        <div>
          <label className={styles.label} htmlFor="full_name">
            Ton nom
          </label>
          <input
            id="full_name"
            name="full_name"
            className={styles.input}
            defaultValue={profile.full_name ?? ""}
            required
          />
        </div>
        <div>
          <label className={styles.label} htmlFor="business_name">
            Nom du business
          </label>
          <input
            id="business_name"
            name="business_name"
            className={styles.input}
            defaultValue={profile.business_name ?? ""}
            required
          />
        </div>
      </div>

      <div className={styles.row}>
        <div>
          <label className={styles.label} htmlFor="business_category">
            Activite
          </label>
          <input
            id="business_category"
            name="business_category"
            className={styles.input}
            defaultValue={profile.business_category ?? ""}
            placeholder="Ex: beaute, resto, immobilier"
            required
          />
        </div>
        <div>
          <label className={styles.label} htmlFor="city">
            Ville
          </label>
          <input
            id="city"
            name="city"
            className={styles.input}
            defaultValue={profile.city ?? ""}
            placeholder="Brazzaville"
            required
          />
        </div>
      </div>

      <div className={styles.row}>
        <div>
          <label className={styles.label} htmlFor="phone">
            Ton numero
          </label>
          <input
            id="phone"
            name="phone"
            className={styles.input}
            defaultValue={profile.phone ?? ""}
            placeholder="+242..."
            required
          />
        </div>
        <div>
          <label className={styles.label} htmlFor="whatsapp_phone">
            Numero WhatsApp
          </label>
          <input
            id="whatsapp_phone"
            name="whatsapp_phone"
            className={styles.input}
            defaultValue={profile.whatsapp_phone ?? profile.phone ?? ""}
            placeholder="+242..."
          />
        </div>
      </div>

      <div>
        <label className={styles.label} htmlFor="brand_tone">
          Style voulu
        </label>
        <textarea
          id="brand_tone"
          name="brand_tone"
          className={styles.textarea}
          defaultValue={profile.brand_tone ?? ""}
          placeholder="Ex: chic, chaleureux, moderne, populaire, premium"
          required
        />
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
      {success ? <p className={styles.success}>{success}</p> : null}

      <div className={styles.actions}>
        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? "Enregistrement..." : "Enregistrer mon profil"}
        </button>
      </div>
    </form>
  );
}
