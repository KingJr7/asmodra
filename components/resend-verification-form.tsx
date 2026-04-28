"use client";

import { useState } from "react";
import styles from "./forms.module.css";

type ResendVerificationFormProps = {
  email?: string;
};

export function ResendVerificationForm({ email = "" }: ResendVerificationFormProps) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState(email);

  async function handleClick() {
    setError("");
    setSuccess("");
    setLoading(true);

    const response = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: value }),
    });

    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Impossible de renvoyer l'email.");
      return;
    }

    setSuccess(payload.message ?? "Email renvoye.");
  }

  return (
    <div className={styles.stack}>
      {!email ? (
        <div>
          <label className={styles.label} htmlFor="resend-verification-email">
            Email du compte
          </label>
          <input
            id="resend-verification-email"
            className={styles.input}
            type="email"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </div>
      ) : null}
      {error ? <p className={styles.error}>{error}</p> : null}
      {success ? <p className={styles.success}>{success}</p> : null}
      <div className={styles.actions}>
        <button className={styles.secondaryButton} type="button" disabled={loading} onClick={handleClick}>
          {loading ? "Envoi..." : "Renvoyer l'email de verification"}
        </button>
      </div>
    </div>
  );
}
