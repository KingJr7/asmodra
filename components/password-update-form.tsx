"use client";

import { useState } from "react";
import styles from "./forms.module.css";

type PasswordUpdateFormProps = {
  mode: "reset" | "change";
};

export function PasswordUpdateForm({ mode }: PasswordUpdateFormProps) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setSuccess("");

    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirm_password") ?? "");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/auth/update-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Impossible de mettre a jour le mot de passe.");
      return;
    }

    setSuccess(payload.message ?? "Mot de passe mis a jour.");

    if (payload.redirectTo) {
      window.location.href = payload.redirectTo;
    }
  }

  return (
    <form className={`${styles.panel} ${styles.stack}`} action={handleSubmit}>
      <div className={styles.row}>
        <div>
          <label className={styles.label} htmlFor={`${mode}-password`}>
            Nouveau mot de passe
          </label>
          <input
            id={`${mode}-password`}
            name="password"
            type="password"
            className={styles.input}
            minLength={8}
            required
          />
        </div>
        <div>
          <label className={styles.label} htmlFor={`${mode}-confirm-password`}>
            Confirmation
          </label>
          <input
            id={`${mode}-confirm-password`}
            name="confirm_password"
            type="password"
            className={styles.input}
            minLength={8}
            required
          />
        </div>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}
      {success ? <p className={styles.success}>{success}</p> : null}

      <div className={styles.actions}>
        <button className={styles.button} type="submit" disabled={loading}>
          {loading
            ? "Mise a jour..."
            : mode === "reset"
              ? "Definir le nouveau mot de passe"
              : "Changer le mot de passe"}
        </button>
      </div>
    </form>
  );
}
