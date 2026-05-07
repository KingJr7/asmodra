import styles from "./dashboard.module.css";
import sharedStyles from "../shared-page.module.css";
import Link from "next/link";
import { MainNavigation } from "@/components/main-navigation";
import { requireUser, computeQuotaSnapshot, isProfileOnboardingComplete } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getPlanDefinition } from "@/lib/plans";
import type { PaymentRecord } from "@/lib/types";
import { LogoutButton } from "@/components/logout-button";
import { PasswordUpdateForm } from "@/components/password-update-form";
import { OnboardingForm } from "@/components/onboarding-form";
import { ResendVerificationForm } from "@/components/resend-verification-form";
import { Reveal } from "@/components/motion/reveal";

function paymentStatusLabel(status: PaymentRecord["status"]) {
  switch (status) {
    case "paid": return "Payé";
    case "processing": return "En attente";
    case "pending": return "Initié";
    case "failed": return "Échec";
    case "expired": return "Expiré";
    case "cancelled": return "Annulé";
    default: return status;
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
          .limit(5)
          .returns<PaymentRecord[]>()
      ).data
    : null;

  return (
    <main className={sharedStyles.page}>
      <div className={styles.dashboardPage}>
        <header className={styles.hero}>
          <Reveal className={styles.heroContent}>
            <span className={styles.welcome}>Tableau de bord</span>
            <h1 className={styles.title}>
              Bienvenue dans ton espace créatif, {viewer.profile.full_name?.split(' ')[0] || 'Artiste'}
            </h1>
            
            <div className={styles.mainActions}>
              <Link href="/generate" className={styles.createBtn}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Créer une nouvelle affiche
              </Link>
              <Link href="/generate" className={styles.prominentCta}>
                <span className={styles.ctaBadge}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline', marginRight: '0.4rem' }}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  NOUVEAU
                </span>
                <span>Créer mon premier flyer gratuitement</span>
              </Link>
            </div>
          </Reveal>
        </header>

        <section className={styles.statsGrid}>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>Crédits disponibles</span>
            <div className={styles.statValue}>{quota.quota_remaining}</div>
            <p className={styles.statSub}>
              {quota.monthly_quota - quota.quota_used} mensuels + {quota.bonus_credits} packs
            </p>
            <div className={styles.creditBadge}>ACTIF</div>
          </article>

          <article className={styles.statCard}>
            <span className={styles.statLabel}>Plan Actuel</span>
            <div className={styles.statValue}>{plan.name}</div>
            <p className={styles.statSub}>{plan.description}</p>
            <Link href="/pricing" style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 700, textDecoration: 'none', marginTop: '1rem', display: 'block' }}>
              Changer d&apos;offre →
            </Link>
          </article>

          <article className={styles.statCard}>
            <span className={styles.statLabel}>État du Profil</span>
            <div className={styles.statValue}>{onboardingComplete ? "Complet" : "À finir"}</div>
            <p className={styles.statSub}>
              {onboardingComplete ? "Ton profil est prêt." : "Quelques infos manquent."}
            </p>
          </article>
        </section>

        <div className={styles.formGrid}>
          <section className={styles.activitySection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Paiements Récents</h2>
            </div>
            <div className={styles.activityList}>
              {(recentPayments ?? []).length > 0 ? (
                recentPayments?.map((item) => (
                  <div key={item.id} className={styles.activityItem}>
                    <div className={styles.itemInfo}>
                      <h4>Pack {item.plan_id.toUpperCase()}</h4>
                      <p>{new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
                    </div>
                    <div className={styles.itemAmount}>{item.amount_xaf.toLocaleString('fr-FR')} FCFA</div>
                    <div className={`${styles.itemStatus} ${styles['status-' + item.status] || ''}`}>
                      {paymentStatusLabel(item.status)}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: '#717082' }}>Aucun historique de paiement pour le moment.</p>
              )}
            </div>
          </section>

          <section className={styles.settingsSection}>
            <h2 className={styles.sectionTitle}>Paramètres du compte</h2>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <h3>Sécurité</h3>
                <PasswordUpdateForm mode="change" />
              </div>
              <div className={styles.formGroup}>
                <h3>Informations</h3>
                {!viewer.user.email_confirmed_at && (
                  <div style={{ marginBottom: '2rem' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--warning)', marginBottom: '1rem' }}>Vérifie ton email pour sécuriser ton compte.</p>
                    <ResendVerificationForm email={viewer.profile.email} />
                  </div>
                )}
                <OnboardingForm profile={viewer.profile} />
              </div>
            </div>
            <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
              <LogoutButton />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
