"use client";

import { useState } from "react";
import styles from "./forms.module.css";

export function ForgotPasswordForm() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setSuccess("");
    setLoading(true);

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(Object.fromEntries(formData.entries())),
    });

    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Impossible d'envoyer l'email.");
      return;
    }

    setSuccess(payload.message ?? "Email envoye.");
  }

  return (
    <form className={`${styles.panel} ${styles.stack}`} action={handleSubmit}>
      <div>
        <label className={styles.label} htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" className={styles.input} required />
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
      {success ? <p className={styles.success}>{success}</p> : null}

      <div className={styles.actions}>
        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? "Envoi..." : "Envoyer le lien"}
        </button>
      </div>
    </form>
  );
}
