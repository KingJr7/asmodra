"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./forms.module.css";

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setSuccess("");
    setLoading(true);

    const response = await fetch(
      mode === "signup" ? "/api/auth/sign-up" : "/api/auth/sign-in",
      {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(formData.entries())),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const payload = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Une erreur est survenue.");
      return;
    }

    setSuccess(payload.message ?? "Operation reussie.");

    if (payload.redirectTo) {
      window.location.href = payload.redirectTo;
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setSuccess("");
    setGoogleLoading(true);

    const supabase = createClient();

    if (!supabase) {
      setGoogleLoading(false);
      setError("La connexion Google n'est pas disponible pour le moment.");
      return;
    }

    const redirectTo = `${window.location.origin}/auth/callback?next=${
      mode === "signup" ? "/onboarding" : "/dashboard"
    }`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (oauthError) {
      setGoogleLoading(false);
      setError(oauthError.message);
    }
  }

  return (
    <form
      className={`${styles.panel} ${styles.stack}`}
      action={async (formData) => handleSubmit(formData)}
    >
      <div className={styles.oauthBlock}>
        <button
          type="button"
          className={styles.oauthButton}
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
        >
          {googleLoading ? "Ouverture..." : "Continuer avec Google"}
        </button>
        <p className={styles.hint}>
          Le moyen le plus rapide pour entrer et commencer.
        </p>
      </div>

      <div className={styles.divider}>
        <span>ou avec ton email</span>
      </div>

      {mode === "signup" ? (
        <div className={styles.row}>
          <div>
            <label className={styles.label} htmlFor="full_name">
              Ton nom
            </label>
            <input id="full_name" name="full_name" className={styles.input} required />
          </div>
          <div>
            <label className={styles.label} htmlFor="business_name">
              Nom du business
            </label>
            <input id="business_name" name="business_name" className={styles.input} />
          </div>
        </div>
      ) : null}

      <div className={styles.row}>
        <div>
          <label className={styles.label} htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" className={styles.input} required />
        </div>
        <div>
          <label className={styles.label} htmlFor="password">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className={styles.input}
            minLength={8}
            required
          />
        </div>
      </div>

      {mode === "signup" ? (
        <div>
          <label className={styles.label} htmlFor="phone">
            Numero WhatsApp
          </label>
          <input id="phone" name="phone" className={styles.input} placeholder="+242..." />
        </div>
      ) : null}

      <p className={styles.hint}>
        {mode === "signup"
          ? "Tu pourras ajouter les infos de ton activite juste apres."
          : "Entre avec ton email et ton mot de passe pour retrouver ton compte."}
      </p>

      {error ? <p className={styles.error}>{error}</p> : null}
      {success ? <p className={styles.success}>{success}</p> : null}

      <div className={styles.actions}>
        <button type="submit" className={styles.button} disabled={loading}>
          {loading
            ? "Traitement..."
            : mode === "signup"
              ? "Creer mon compte"
              : "Me connecter"}
        </button>
      </div>

      {mode === "login" ? (
        <p className={styles.hint}>
          Si tu as oublie ton mot de passe, tu peux le changer en quelques minutes.
        </p>
      ) : null}
    </form>
  );
}
