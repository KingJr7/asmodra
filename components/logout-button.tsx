"use client";

import styles from "./forms.module.css";

export function LogoutButton() {
  return (
    <button
      type="button"
      className={styles.secondaryButton}
      onClick={async () => {
        await fetch("/api/auth/sign-out", { method: "POST" });
        window.location.href = "/";
      }}
    >
      Se deconnecter
    </button>
  );
}
