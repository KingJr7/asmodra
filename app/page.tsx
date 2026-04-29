import styles from "./page.module.css";
import Link from "next/link";
import { HoverCard, Reveal } from "@/components/motion/reveal";
import { getViewer } from "@/lib/auth";

const features = [
  {
    title: "Intelligence creative",
    text: "Asmodra transforme ton brief en concept visuel fort, avec une direction claire et vendable.",
    icon: "✦",
  },
  {
    title: "Personnalisation totale",
    text: "Tu ajustes format, ton, couleurs et message pour garder une affiche fidele a ta marque.",
    icon: "◉",
  },
  {
    title: "Export pro",
    text: "Carre, story ou print: ton visuel sort propre, lisible et pret a publier immediatement.",
    icon: "⬢",
  },
];

const plans = [
  {
    name: "Starter",
    price: "0 FCFA",
    detail: "17 credits / mois",
    perks: ["Signature Asmodra", "Generation standard", "Support standard"],
  },
  {
    name: "Pro",
    price: "15 000 FCFA / mois",
    detail: "260 credits / mois",
    perks: ["Formats complets", "Sans signature", "Support prioritaire"],
    featured: true,
  },
  {
    name: "Business",
    price: "35 000 FCFA / mois",
    detail: "760 credits / mois",
    perks: ["Volume eleve", "Templates dedies", "Suivi equipe"],
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
          <Link href="/flyers">Voir nos réalisations</Link>
          <Link href="/generate">Créer un flyer</Link>
          <Link href="/pricing">Tarifs</Link>
          <Link href={isLoggedIn ? "/dashboard" : "/signup"}>
            {isLoggedIn ? "Mon compte" : "S'inscrire"}
          </Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.ambientGlow} />
        <Reveal className={styles.heroCopy}>
          <p className={styles.kicker}>Lancement Asmodra Studio</p>
          <h1>Cree des affiches pro en quelques secondes avec l&apos;IA.</h1>
          <p className={styles.lead}>
            Donne ton offre, ton style et ton format. Asmodra construit une composition
            moderne, lisible et prete pour WhatsApp, Instagram ou impression.
          </p>
          <div className={styles.heroActions}>
            <Link href={isLoggedIn ? "/generate" : "/signup"} className={styles.primaryCta}>
              {isLoggedIn ? "Commencer une création" : "Essayer gratuitement"}
            </Link>
            <Link href="/pricing" className={styles.ghostCta}>
              Découvrir nos tarifs
            </Link>
          </div>
        </Reveal>

        <Reveal className={styles.demoPhone} delay={0.16}>
          <div className={styles.phoneNotch} />
          <div className={styles.phoneScene}>
            <div className={styles.phoneOverlay} />
            <div className={styles.phoneCard}>
              <div className={styles.phoneRow}>
                <span>Generation en cours...</span>
                <span className={styles.spinner}>◌</span>
              </div>
              <div className={styles.progressTrack}>
                <div className={styles.progressFill} />
              </div>
              <div className={styles.tagRow}>
                <span>#Promo</span>
                <span>#Neon</span>
                <span>#Story</span>
              </div>
            </div>
          </div>
          <div className={styles.phoneFooter}>
            <small>Apercu mobile de creation Asmodra</small>
          </div>
        </Reveal>
      </section>

      <Reveal className={styles.features} delay={0.06}>
        <h2>La puissance d&apos;un studio design, dans ton navigateur.</h2>
        <div className={styles.featureGrid}>
          {features.map((feature) => (
            <HoverCard key={feature.title} className={styles.featureCard}>
              <div className={styles.featureIcon}>{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </HoverCard>
          ))}
        </div>
      </Reveal>

      <Reveal className={styles.paymentBanner} delay={0.08}>
        <div className={styles.paymentGlowLeft} />
        <div className={styles.paymentGlowRight} />
        <h2>Paiement local simple et securise</h2>
        <p>Abonne-toi en FCFA et gere ton rythme de production sans friction.</p>
        <div className={styles.paymentMethods}>
          <div className={styles.methodChip}>
            <span className={styles.yellowDot} />
            MTN Mobile Money
          </div>
          <div className={styles.methodChip}>
            <span className={styles.redDot} />
            Airtel Money
          </div>
        </div>
      </Reveal>

      <Reveal className={styles.pricing} id="pricing" delay={0.1}>
        <div className={styles.sectionHead}>
          <p>Tarification</p>
          <h2>Des offres claires en credits pour ton volume reel.</h2>
        </div>
        <div className={styles.planGrid}>
          {plans.map((plan) => (
            <HoverCard
              key={plan.name}
              className={`${styles.plan} ${plan.featured ? styles.featured : ""}`}
            >
              {plan.featured ? <span className={styles.popular}>Le plus populaire</span> : null}
              <h3>{plan.name}</h3>
              <p className={styles.price}>{plan.price}</p>
              <p className={styles.detail}>{plan.detail}</p>
              <ul>
                {plan.perks.map((perk) => (
                  <li key={perk}>{perk}</li>
                ))}
              </ul>
              <Link href={isLoggedIn ? "/pricing" : "/signup"} className={styles.planButton}>
                {isLoggedIn ? "Gérer mon abonnement" : "S'abonner"}
              </Link>
            </HoverCard>
          ))}
        </div>
      </Reveal>

      <Reveal className={styles.finalCta} delay={0.12}>
        <h2>Tu peux sortir ton prochain visuel maintenant.</h2>
        <p>Va dans le studio, ecris ton brief et laisse Asmodra composer.</p>
        <Link href="/generate" className={styles.finalButton}>
          Créer un flyer maintenant
        </Link>
      </Reveal>
    </main>
  );
}
