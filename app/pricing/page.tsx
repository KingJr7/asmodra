import styles from "./pricing.module.css";
import sharedStyles from "../shared-page.module.css";
import Link from "next/link";
import { CREDIT_PACK_LIST, PLAN_LIST } from "@/lib/plans";
import { getViewer } from "@/lib/auth";
import { PaymentCheckout } from "@/components/payment-checkout";

export default async function PricingPage() {
  const viewer = await getViewer();
  
  const checkoutItems = [
    ...PLAN_LIST.filter(p => p.monthlyPriceXaf > 0).map((plan) => ({ 
      ...plan, 
      amountXaf: plan.monthlyPriceXaf,
      kind: "plan" as const 
    })),
    ...CREDIT_PACK_LIST.map(pack => ({
      ...pack,
      amountXaf: pack.priceXaf,
      monthlyQuota: pack.credits,
      kind: "credit_pack" as const,
      watermark: false
    })),
  ];

  return (
    <main className={sharedStyles.page}>
      <header className={sharedStyles.topbar}>
        <Link href="/" className={sharedStyles.logo}>
          ASMODRA
        </Link>
        <nav className={sharedStyles.nav}>
          <Link href="/generate">Studio</Link>
          <Link href={viewer?.user ? "/dashboard" : "/signup"}>
            {viewer?.user ? "Mon espace" : "Inscription"}
          </Link>
          <Link href="/support">Support</Link>
        </nav>
      </header>

      <div className={styles.pricingPage}>
        <header className={styles.header}>
          <h1 className={styles.title}>Domine ton marché avec l&apos;IA</h1>
          <p className={styles.lead}>
            Des visuels de qualité agence, générés en quelques secondes. 
            Choisis le pack qui correspond à tes ambitions.
          </p>
        </header>

        <div className={styles.plansGrid}>
          {PLAN_LIST.map((plan) => (
            <article
              key={plan.id}
              className={`${styles.planCard} ${plan.id === "pro" ? styles.featured : ""}`}
            >
              <span className={styles.planName}>{plan.name}</span>
              <div className={styles.planPrice}>
                {plan.monthlyPriceXaf > 0 ? (
                  <>
                    {plan.monthlyPriceXaf.toLocaleString("fr-FR")}
                    <span>FCFA/mois</span>
                  </>
                ) : (
                  "Gratuit"
                )}
              </div>
              
              <p style={{ color: "#a19db1", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
                {plan.description}
              </p>

              <ul className={styles.perksList}>
                {plan.perks.map((perk, i) => (
                  <li key={i} className={styles.perkItem}>
                    <svg className={styles.perkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    {perk}
                  </li>
                ))}
              </ul>

              <Link 
                href={viewer?.user ? "#checkout" : "/signup"} 
                className={`${styles.planBtn} ${plan.monthlyPriceXaf > 0 ? styles.primaryBtn : styles.ghostBtn}`}
              >
                {viewer?.user ? (plan.monthlyPriceXaf > 0 ? "Prendre ce plan" : "Plan actuel") : "Commencer"}
              </Link>
            </article>
          ))}
        </div>

        <section className={styles.packsSection}>
          <h2 style={{ textAlign: "center", fontSize: "2rem", fontWeight: 800, marginBottom: "2rem" }}>
            Besoin de plus ? Packs de crédits
          </h2>
          <div className={styles.packsGrid}>
            {CREDIT_PACK_LIST.map((pack) => (
              <article key={pack.id} className={styles.packCard}>
                <div className={styles.packName}>{pack.name}</div>
                <div className={styles.packCredits}>+{pack.credits} crédits</div>
                <div className={styles.packPrice}>
                  {pack.priceXaf.toLocaleString("fr-FR")} FCFA en une fois
                </div>
                <p style={{ fontSize: "0.8rem", color: "#717082", marginTop: "1rem" }}>
                  {pack.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        {viewer?.user && viewer.profile ? (
          <section id="checkout" className={styles.checkoutSection}>
            <div className={styles.checkoutBackdrop} />
            <div className={styles.checkoutHeader}>
              <p className={styles.checkoutEyebrow}>Encaissement sécurisé</p>
              <h2 className={styles.checkoutTitle}>Paiement Mobile Rapide</h2>
              <p className={styles.checkoutLead}>
                Sélectionne ton offre, reçois la demande sur ton téléphone, puis confirme en un clic.
                Activation des crédits juste après validation.
              </p>
              <div className={styles.checkoutBadges}>
                <span className={styles.operatorBadge}>MTN Mobile Money</span>
                <span className={styles.operatorBadge}>Airtel Money</span>
                <span className={styles.operatorBadge}>Référence de suivi incluse</span>
              </div>
            </div>

            <div className={styles.checkoutGrid}>
              <aside className={styles.checkoutAside}>
                <h3>Comment ça marche</h3>
                <ol className={styles.checkoutSteps}>
                  <li>Choisis ton plan ou pack.</li>
                  <li>Entre ton numéro MTN/Airtel Congo.</li>
                  <li>Valide la demande reçue sur ton téléphone.</li>
                  <li>Les crédits deviennent disponibles automatiquement.</li>
                </ol>
                <p className={styles.checkoutNote}>
                  Si le réseau est lent, garde la même référence et évite de relancer plusieurs fois.
                </p>
              </aside>

              <div className={styles.checkoutCard}>
                <PaymentCheckout
                  plans={checkoutItems}
                  currentPlanId={viewer.profile.plan_id as "starter" | "pro" | "business"}
                />
              </div>
            </div>
          </section>
        ) : (
          <div style={{ textAlign: "center", marginTop: "4rem" }}>
            <Link href="/signup" className={styles.planBtn} style={{ maxWidth: "300px", display: "inline-block" }}>
              Créer un compte pour s&apos;abonner
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
