import styles from "../shared-page.module.css";
import Link from "next/link";
import { requireUser, computeQuotaSnapshot, isProfileOnboardingComplete } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPlanDefinition } from "@/lib/plans";
import type { PaymentRecord } from "@/lib/types";
import { LogoutButton } from "@/components/logout-button";
import { PasswordUpdateForm } from "@/components/password-update-form";
import { OnboardingForm } from "@/components/onboarding-form";
import { ResendVerificationForm } from "@/components/resend-verification-form";

function paymentStatusLabel(status: PaymentRecord["status"]) {
  switch (status) {
    case "paid":
      return "paye";
    case "processing":
      return "en attente de confirmation";
    case "pending":
      return "demande creee";
    case "failed":
      return "echec";
    case "expired":
      return "expire";
    case "cancelled":
      return "annule";
    default:
      return status;
  }
}

export default async function DashboardPage() {
  const viewer = await requireUser();
  const supabase = await createClient();
  const quota = computeQuotaSnapshot(viewer.profile);
  const plan = getPlanDefinition(viewer.profile.plan_id);
  const onboardingComplete = isProfileOnboardingComplete(viewer.profile);
  const recentPayments = supabase
    ? (
        await supabase
          .from("payment_transactions")
          .select("*")
          .eq("user_id", viewer.user.id)
          .order("created_at", { ascending: false })
          .limit(8)
          .returns<PaymentRecord[]>()
      ).data
    : null;

  const lastPayment = recentPayments?.[0] ?? null;

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.logo}>
          ASMODRA
        </Link>
        <nav className={styles.nav}>
          <a href="/generate">Nouvelle affiche</a>
          <a href="/pricing">Changer d&apos;offre</a>
          <a href="/admin">Admin</a>
        </nav>
      </header>

      <section className={styles.shell}>
        <p className={styles.kicker}>Mon espace</p>
        <h1 className={styles.title}>Retrouve tout ce qui compte au meme endroit</h1>
        <p className={styles.lead}>
          Ici, tu vois ton offre, tes credits restants, tes reglages et tes
          paiements recents sans chercher partout.
        </p>

        <div className={styles.grid4}>
          <article className={styles.card}>
            <h3>Offre actuelle</h3>
            <p className={styles.meta}>{plan.name}</p>
            <span className={styles.pill}>
              {quota.quota_remaining} credit(s) restants
            </span>
            <p className={styles.meta}>
              Mensuel: {Math.max(quota.monthly_quota - quota.quota_used, 0)} • Packs:{" "}
              {quota.bonus_credits}
            </p>
          </article>
          <article className={styles.card}>
            <h3>Profil</h3>
            <p className={styles.meta}>
              {onboardingComplete ? "Profil complet" : "Quelques infos manquent"}
            </p>
            <span className={styles.pill}>
              {viewer.profile.onboarding_completed ? "termine" : "a completer"}
            </span>
          </article>
          <article className={styles.card}>
            <h3>Email</h3>
            <p className={styles.meta}>{viewer.profile.email}</p>
            <span className={styles.pill}>
              {viewer.user.email_confirmed_at ? "verifie" : "non verifie"}
            </span>
          </article>
          <article className={styles.card}>
            <h3>Dernier paiement</h3>
            <p className={styles.meta}>
              {lastPayment
                ? `${lastPayment.amount_xaf.toLocaleString("fr-FR")} FCFA`
                : "Aucun paiement"}
            </p>
            <span className={styles.pill}>
              {lastPayment ? paymentStatusLabel(lastPayment.status) : "inactif"}
            </span>
          </article>
        </div>

        {!viewer.user.email_confirmed_at ? (
          <section className={styles.section}>
            <h2>Valider mon email</h2>
            <ResendVerificationForm email={viewer.profile.email} />
          </section>
        ) : null}

        {!onboardingComplete ? (
          <section className={styles.section}>
            <h2>Completer mon profil</h2>
            <OnboardingForm profile={viewer.profile} />
          </section>
        ) : null}

        <section className={styles.section}>
          <h2>Mes paiements</h2>
          <div className={styles.grid3}>
            {(recentPayments ?? []).length ? (
              recentPayments?.map((item) => (
                <article key={item.id} className={styles.card}>
                  <h3>{item.plan_id.toUpperCase()}</h3>
                  <p className={styles.meta}>
                    {item.amount_xaf.toLocaleString("fr-FR")} FCFA · {paymentStatusLabel(item.status)}
                  </p>
                  <p className={styles.meta}>Reference: {item.provider_reference ?? "non disponible"}</p>
                  <span className={styles.pill}>{item.operator_name ?? "momo"}</span>
                </article>
              ))
            ) : (
              <article className={styles.card}>
                <h3>Aucun paiement pour le moment</h3>
                <p className={styles.meta}>
                  Tu n&apos;as pas encore essaye une offre payante avec ce compte.
                </p>
              </article>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <h2>Mon mot de passe</h2>
          <PasswordUpdateForm mode="change" />
        </section>

        <div className={styles.buttonRow}>
          <Link href="/generate" className={styles.primaryBtn}>
            Creer une affiche
          </Link>
          <LogoutButton />
        </div>
      </section>
    </main>
  );
}
