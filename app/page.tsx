import styles from "./page.module.css";
import Link from "next/link";
import { HoverCard, Reveal } from "@/components/motion/reveal";
import { getViewer } from "@/lib/auth";

const features = [
  {
    title: "Direction Artistique IA",
    text: "Asmodra ne se contente pas de générer une image. Elle conceptualise votre offre selon les codes du design publicitaire africain.",
    icon: "🎨",
  },
  {
    title: "Composition sur Mesure",
    text: "Maîtrisez chaque pixel. Ajustez le format, les couleurs et la hiérarchie pour une affiche qui convertit réellement.",
    icon: "📐",
  },
  {
    title: "Standard Haute Fidélité",
    text: "Exportez vos créations en haute définition, prêtes pour l'impression ou une diffusion massive sur WhatsApp et Instagram.",
    icon: "💎",
  },
];

const plans = [
  {
    name: "Starter",
    price: "0 FCFA",
    detail: "Idéal pour débuter",
    perks: ["2 à 3 générations / mois", "Signature Asmodra", "Accès Studio standard"],
  },
  {
    name: "Pro",
    price: "100 FCFA",
    detail: "Par mois",
    perks: ["~31 générations / mois", "Sans signature Asmodra", "Support prioritaire", "Format HD 1K"],
    featured: true,
  },
  {
    name: "Business",
    price: "25 000 FCFA",
    detail: "Par mois",
    perks: ["~81 générations / mois", "Sans signature Asmodra", "Gestion d'équipe", "Priorité maximale"],
  },
];

export default async function Home() {
  const viewer = await getViewer();
  const isLoggedIn = Boolean(viewer?.user);

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <span className={styles.logo}>ASMODRA</span>
        <nav className={styles.nav}>
          <Link href="/flyers">Showcase</Link>
          <Link href="/generate">Studio</Link>
          <Link href="/pricing">Tarifs</Link>
          <Link href={isLoggedIn ? "/dashboard" : "/signup"}>
            {isLoggedIn ? "Dashboard" : "S'inscrire"}
          </Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.ambientGlow} />
        <Reveal className={styles.heroCopy}>
          <span className={styles.kicker}>Le futur du design est ici</span>
          <h1>L&apos;IA qui conçoit vos affiches comme une agence.</h1>
          <p className={styles.lead}>
            Plus qu&apos;un simple générateur d&apos;images. Asmodra fusionne stratégie marketing et excellence graphique pour propulser votre commerce.
          </p>
          <div className={styles.heroActions}>
            <Link href={isLoggedIn ? "/generate" : "/signup"} className={styles.primaryCta}>
              {isLoggedIn ? "Entrer dans le Studio" : "Essayer gratuitement"}
            </Link>
            <Link href="/flyers" className={styles.ghostCta}>
              Voir les réalisations
            </Link>
          </div>
        </Reveal>

        <Reveal className={styles.demoPhone} delay={0.2}>
          <div className={styles.phoneNotch} />
          <div className={styles.phoneScene}>
            <div className={styles.phoneCard}>
              <div className={styles.phoneRow}>
                <span>Forge créative...</span>
                <span className={styles.spinner}>◌</span>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} />
              </div>
              <div className={styles.tagRow}>
                <span>#Premium</span>
                <span>#Marketing</span>
                <span>#Congo</span>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className={styles.features}>
        <Reveal>
          <h2>Une technologie de pointe pour vos ambitions.</h2>
        </Reveal>
        <div className={styles.featureGrid}>
          {features.map((feature, i) => (
            <Reveal key={feature.title} delay={0.1 * i}>
              <HoverCard className={styles.featureCard}>
                <div className={styles.featureIcon}>{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </HoverCard>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal className={styles.paymentBanner} delay={0.1}>
        <div className={styles.paymentGlowLeft} />
        <div className={styles.paymentGlowRight} />
        <h2>Paiement Mobile Local</h2>
        <p>Abonnez-vous instantanément en FCFA avec MTN Mobile Money ou Airtel Money.</p>
        <div className={styles.paymentMethods}>
          <div className={styles.methodChip}>
            <span className={styles.yellowDot} />
            MTN MoMo
          </div>
          <div className={styles.methodChip}>
            <span className={styles.redDot} />
            Airtel Money
          </div>
        </div>
      </Reveal>

      <section className={styles.pricing} id="pricing">
        <div className={styles.sectionHead}>
          <Reveal>
            <p>Tarification</p>
            <h2>Des plans adaptés à votre croissance.</h2>
          </Reveal>
        </div>
        <div className={styles.planGrid}>
          {plans.map((plan, i) => (
            <Reveal key={plan.name} delay={0.1 * i}>
              <HoverCard className={`${styles.plan} ${plan.featured ? styles.featured : ""}`}>
                {plan.featured ? <span className={styles.popular}>Recommandé</span> : null}
                <h3>{plan.name}</h3>
                <p className={styles.price}>{plan.price}</p>
                <p className={styles.detail}>{plan.detail}</p>
                <ul>
                  {plan.perks.map((perk) => (
                    <li key={perk}>{perk}</li>
                  ))}
                </ul>
                <Link href={isLoggedIn ? "/pricing" : "/signup"} className={styles.planButton}>
                  {plan.name === "Starter" ? "Commencer" : "Choisir ce plan"}
                </Link>
              </HoverCard>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal className={styles.finalCta}>
        <h2>Prêt à dominer votre marché ?</h2>
        <Link href="/generate" className={styles.finalButton}>
          Lancer ma première création
        </Link>
      </Reveal>

      <footer style={{ padding: "4rem 2rem", textAlign: "center", borderTop: "1px solid var(--glass-border)", color: "#717082", fontSize: "0.8rem" }}>
        <p>© 2026 ASMODRA Studio. Tous droits réservés.</p>
        <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center", gap: "1.5rem" }}>
          <Link href="/legal/cgu">CGU</Link>
          <Link href="/legal/privacy">Confidentialité</Link>
          <Link href="/support">Support</Link>
        </div>
      </footer>
    </main>
  );
}
