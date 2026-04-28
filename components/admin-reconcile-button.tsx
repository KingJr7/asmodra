"use client";

import { useState } from "react";
import styles from "./forms.module.css";

export function AdminReconcileButton() {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setError("");
    setMessage("");
    setLoading(true);

    const response = await fetch("/api/admin/payments/reconcile", {
      method: "POST",
    });

    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Reconciliation impossible.");
      return;
    }

    setMessage(payload.message ?? "Reconciliation terminee.");
    window.location.reload();
  }

  return (
    <div className={styles.stack}>
      {error ? <p className={styles.error}>{error}</p> : null}
      {message ? <p className={styles.success}>{message}</p> : null}
      <div className={styles.actions}>
        <button className={styles.secondaryButton} type="button" onClick={handleClick} disabled={loading}>
          {loading ? "Reconciliation..." : "Reconciler les paiements en attente"}
        </button>
      </div>
    </div>
  );
}
