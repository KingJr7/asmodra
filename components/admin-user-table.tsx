"use client";

import { useState } from "react";
import styles from "./forms.module.css";

type AdminUser = {
  id: string;
  email: string;
  role: "user" | "admin";
  plan_id: "starter" | "pro" | "business";
  onboarding_completed: boolean;
  business_name: string | null;
};

type AdminUserTableProps = {
  users: AdminUser[];
};

export function AdminUserTable({ users }: AdminUserTableProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingId, setLoadingId] = useState("");

  async function handleSubmit(userId: string, formData: FormData) {
    setError("");
    setMessage("");
    setLoadingId(userId);

    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        role: formData.get("role"),
        plan_id: formData.get("plan_id"),
        subscription_status: formData.get("subscription_status"),
        onboarding_completed: formData.get("onboarding_completed") === "true",
      }),
    });

    const payload = await response.json();
    setLoadingId("");

    if (!response.ok) {
      setError(payload.error ?? "Mise a jour admin impossible.");
      return;
    }

    setMessage(payload.message ?? "Utilisateur mis a jour.");
    window.location.reload();
  }

  return (
    <div className={styles.stack}>
      {error ? <p className={styles.error}>{error}</p> : null}
      {message ? <p className={styles.success}>{message}</p> : null}
      <div className={styles.panel}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Compte</th>
              <th>Business</th>
              <th>Gestion</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <strong>{user.email}</strong>
                  <div className={styles.muted}>{user.id}</div>
                </td>
                <td>
                  <strong>{user.business_name ?? "non renseigne"}</strong>
                  <div className={styles.muted}>
                    profil: {user.onboarding_completed ? "complet" : "a finir"}
                  </div>
                </td>
                <td>
                  <form
                    className={styles.inlineForm}
                    action={(formData) => handleSubmit(user.id, formData)}
                  >
                    <select
                      name="role"
                      className={styles.inlineSelect}
                      defaultValue={user.role}
                    >
                      <option value="user">client</option>
                      <option value="admin">admin</option>
                    </select>
                    <select
                      name="plan_id"
                      className={styles.inlineSelect}
                      defaultValue={user.plan_id}
                    >
                      <option value="starter">starter</option>
                      <option value="pro">pro</option>
                      <option value="business">business</option>
                    </select>
                    <select
                      name="subscription_status"
                      className={styles.inlineSelect}
                      defaultValue="active"
                    >
                      <option value="inactive">arrete</option>
                      <option value="pending">en attente</option>
                      <option value="active">actif</option>
                      <option value="expired">termine</option>
                    </select>
                    <select
                      name="onboarding_completed"
                      className={styles.inlineSelect}
                      defaultValue={user.onboarding_completed ? "true" : "false"}
                    >
                      <option value="true">profil complet</option>
                      <option value="false">profil a finir</option>
                    </select>
                    <button
                      className={styles.secondaryButton}
                      type="submit"
                      disabled={loadingId === user.id}
                    >
                      {loadingId === user.id ? "..." : "Mettre a jour"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
