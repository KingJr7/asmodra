import styles from "../shared-page.module.css";
import Link from "next/link";
import { CREDIT_PACK_LIST, PLAN_LIST } from "@/lib/plans";
import { getViewer } from "@/lib/auth";
import { PaymentCheckout } from "@/components/payment-checkout";

export default async function PricingPage() {
  const viewer = await getViewer();
  const paidPlans = PLAN_LIST.filter((plan) => plan.monthlyPriceXaf > 0).map((plan) => ({
    id: plan.id,
    name: plan.name,
    amountXaf: plan.monthlyPriceXaf,
    monthlyQuota: plan.monthlyQuota,
    description: plan.description,
    watermark: plan.watermark,
  }));
  const creditPacks = CREDIT_PACK_LIST.map((pack) => ({
    id: pack.id,
    name: pack.name,
    amountXaf: pack.priceXaf,
    monthlyQuota: pack.credits,
    description: pack.description,
    watermark: false,
    kind: "credit_pack" as const,
  }));
  const checkoutItems = [
    ...paidPlans.map((plan) => ({ ...plan, kind: "plan" as const })),
    ...creditPacks,
  ];

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.logo}>
          ASMODRA
        </Link>
        <nav className={styles.nav}>
          <a href="/generate">Studio</a>
          <a href={viewer?.user ? "/dashboard" : "/signup"}>
            {viewer?.user ? "Mon espace" : "Inscription"}
          </a>
          <a href="/support">Support</a>
        </nav>
      </header>

      <section className={styles.shell}>
        <p className={styles.kicker}>Tarifs</p>
        <h1 className={styles.title}>Choisis ton solde de credits et ton rythme mensuel</h1>
        <p className={styles.lead}>
          Chaque generation et chaque retouche consomment des credits selon ton usage.
        </p>
        <div className={styles.grid3}>
          {PLAN_LIST.map((plan) => (
            <article
              key={plan.id}
              className={`${styles.card} ${plan.id === "pro" ? styles.featured : ""}`}
            >
              <h3>{plan.name}</h3>
              <p className={styles.meta}>
                {plan.monthlyPriceXaf.toLocaleString("fr-FR")} FCFA par mois
              </p>
              <p className={styles.meta}>{plan.monthlyQuota} credits / mois</p>
              <span className={styles.pill}>
                {plan.watermark ? "avec signature Asmodra" : "sans signature"}
              </span>
              <p className={styles.meta}>{plan.description}</p>
            </article>
          ))}
        </div>

        <section className={styles.section}>
          <h2>Packs de credits</h2>
          <p className={styles.lead}>
            Ces packs s&apos;ajoutent a ton solde disponible et s&apos;utilisent avec ou sans abonnement.
          </p>
          <div className={styles.grid2}>
            {CREDIT_PACK_LIST.map((pack) => (
              <article key={pack.id} className={styles.card}>
                <h3>{pack.name}</h3>
                <p className={styles.meta}>
                  {pack.priceXaf.toLocaleString("fr-FR")} FCFA en une fois
                </p>
                <p className={styles.meta}>{pack.credits} credits en plus</p>
                <span className={styles.pill}>utilisable avec ou sans abonnement</span>
                <p className={styles.meta}>{pack.description}</p>
              </article>
            ))}
          </div>
        </section>

        {viewer?.user && viewer.profile ? (
          <section className={styles.section}>
            <h2>Choisis une offre ou un pack puis paie en une fois</h2>
            <p className={styles.lead}>
              Selectionne ce qu&apos;il te faut, remplis tes infos une seule fois,
              puis valide le paiement sur ton telephone. Les packs de credits
              s&apos;ajoutent a ton total, meme sans offre mensuelle payante.
            </p>
            <PaymentCheckout
              plans={checkoutItems}
              currentPlanId={viewer.profile.plan_id as "starter" | "pro" | "business"}
            />
          </section>
        ) : null}

        <div className={styles.buttonRow}>
          <a href={viewer?.user ? "/dashboard" : "/signup"} className={styles.primaryBtn}>
            {viewer?.user ? "Retour a mon espace" : "Creer mon compte"}
          </a>
          {!viewer?.user ? (
            <a href="/login" className={styles.ghostBtn}>
              Me connecter
            </a>
          ) : null}
        </div>
      </section>
    </main>
  );
}
