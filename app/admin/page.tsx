import styles from "../shared-page.module.css";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminUserTable } from "@/components/admin-user-table";
import { AdminReconcileButton } from "@/components/admin-reconcile-button";
import type { PaymentRecord, ProfileRecord, SubscriptionRecord } from "@/lib/types";

export default async function AdminPage() {
  await requireAdmin();
  const admin = createAdminClient();
  const [
    { count: usersCount },
    { count: paidSubscriptionsCount },
    { count: generationsCount },
    { data: users },
    { data: subscriptions },
    { data: payments },
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    admin.from("generation_audits").select("*", { count: "exact", head: true }),
    admin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(12)
      .returns<ProfileRecord[]>(),
    admin
      .from("subscriptions")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(8)
      .returns<SubscriptionRecord[]>(),
    admin
      .from("payment_transactions")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(10)
      .returns<PaymentRecord[]>(),
  ]);

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.logo}>
          ASMODRA
        </Link>
        <nav className={styles.nav}>
          <a href="/dashboard">Mon espace</a>
          <a href="/pricing">Tarifs</a>
          <a href="/support">Support</a>
        </nav>
      </header>

      <section className={styles.shell}>
        <p className={styles.kicker}>Admin</p>
        <h1 className={styles.title}>Garder un oeil simple sur toute la plateforme</h1>
        <p className={styles.lead}>
          Cet espace aide a voir les nouveaux comptes, les offres actives et les
          derniers paiements en un coup d&apos;oeil.
        </p>
        <div className={styles.grid3}>
          <article className={styles.card}>
            <h3>Utilisateurs</h3>
            <p className={styles.meta}>Total comptes: {usersCount ?? 0}</p>
          </article>
          <article className={styles.card}>
            <h3>Offres actives</h3>
            <p className={styles.meta}>Comptes payants: {paidSubscriptionsCount ?? 0}</p>
          </article>
          <article className={styles.card}>
            <h3>Affiches creees</h3>
            <p className={styles.meta}>Total enregistre: {generationsCount ?? 0}</p>
          </article>
        </div>

        <section className={styles.section}>
          <h2>Utilisateurs</h2>
          <AdminUserTable
            users={(users ?? []).map((user) => ({
              id: user.id,
              email: user.email,
              role: user.role,
              plan_id: user.plan_id as "starter" | "pro" | "business",
              onboarding_completed: user.onboarding_completed,
              business_name: user.business_name,
            }))}
          />
        </section>

        <section className={styles.section}>
          <h2>Offres recentes</h2>
          <div className={styles.grid3}>
            {(subscriptions ?? []).map((subscription) => (
              <article key={subscription.id} className={styles.card}>
                <h3>{subscription.plan_id.toUpperCase()}</h3>
                <p className={styles.meta}>Etat: {subscription.status}</p>
                <p className={styles.meta}>
                  Paiement: {subscription.payment_reference ?? "aucun"}
                </p>
                <span className={styles.pill}>{subscription.user_id}</span>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2>Paiements recents</h2>
          <AdminReconcileButton />
          <div className={styles.grid3}>
            {(payments ?? []).map((payment) => (
              <article key={payment.id} className={styles.card}>
                <h3>{payment.plan_id.toUpperCase()}</h3>
                <p className={styles.meta}>
                  {payment.amount_xaf.toLocaleString("fr-FR")} FCFA · {payment.status}
                </p>
                <p className={styles.meta}>{payment.provider_reference ?? "sans reference"}</p>
                <span className={styles.pill}>{payment.operator_name ?? "momo"}</span>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
