import styles from "./page.module.css";
import Link from "next/link";
import { HoverCard, Reveal } from "@/components/motion/reveal";
import { MainNavigation } from "@/components/main-navigation";
import { getViewer } from "@/lib/auth";

// SVG Icon component
const getFeatureIcon = (iconName: string) => {
  const iconProps = {
    width: "40",
    height: "40",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (iconName) {
    case "palette":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="7" cy="7" r="2" fill="currentColor" />
          <circle cx="17" cy="7" r="2" fill="currentColor" />
          <circle cx="7" cy="17" r="2" fill="currentColor" />
          <circle cx="17" cy="17" r="2" fill="currentColor" />
        </svg>
      );
    case "grid":
      return (
        <svg {...iconProps}>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      );
    case "sparkles":
      return (
        <svg {...iconProps}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" />
        </svg>
      );
    default:
      return <div />;
  }
};

const features = [
  {
    title: "Direction Artistique IA",
    text: "Asmodra ne se contente pas de générer une image. Elle conceptualise votre offre selon les codes du design publicitaire africain.",
    icon: "palette",
  },
  {
    title: "Composition sur Mesure",
    text: "Maîtrisez chaque pixel. Ajustez le format, les couleurs et la hiérarchie pour une affiche qui convertit réellement.",
    icon: "grid",
  },
  {
    title: "Standard Haute Fidélité",
    text: "Exportez vos créations en haute définition, prêtes pour l'impression ou une diffusion massive sur WhatsApp et Instagram.",
    icon: "sparkles",
  },
];

const plans = [
  {
    name: "Starter",
    price: "0 FCFA",
    detail: "Idéal pour débuter",
    perks: ["8 crédits / mois (~1 affiche)", "Signature Asmodra", "Accès Studio standard"],
  },
  {
    name: "Pro",
    price: "15 000 FCFA",
    detail: "Par mois",
    perks: ["~31 générations / mois", "Sans signature Asmodra", "Support prioritaire", "Format HD 1K"],
    featured: true,
  },
  {
    name: "Business",
    price: "25 000 FCFA",
    detail: "Par mois",
    perks: ["~60 générations / mois", "Sans signature Asmodra", "Gestion d'équipe", "Priorité maximale"],
  },
];

const processSteps = [
  {
    title: "Décrivez votre offre",
    text: "Ajoutez votre produit, votre prix et votre objectif commercial. Asmodra structure automatiquement le message.",
  },
  {
    title: "Personnalisez le rendu",
    text: "Choisissez le style, la palette et le format. Vous gardez le contrôle sur chaque variation visuelle.",
  },
  {
    title: "Publiez en un clic",
    text: "Exportez en HD pour impression ou diffusion sociale. Votre flyer est prêt en quelques minutes.",
  },
];

const testimonials = [
  {
    author: "Nadine M.",
    role: "Boutique mode - Brazzaville",
    quote: "Nos visuels sont devenus plus premium et nos promotions WhatsApp convertissent mieux.",
  },
  {
    author: "Christian L.",
    role: "Restaurant - Pointe-Noire",
    quote: "En deux semaines, on a doublé la fréquence de publication sans recruter un designer.",
  },
  {
    author: "Agence Kivu Studio",
    role: "Studio créatif",
    quote: "Asmodra accélère nos maquettes clients tout en gardant une direction artistique cohérente.",
  },
];

const faqs = [
  {
    question: "Asmodra convient-elle aux débutants ?",
    answer: "Oui. Le Studio guide les étapes essentielles pour obtenir un résultat propre, même sans expérience design.",
  },
  {
    question: "Puis-je utiliser mes visuels pour la pub payante ?",
    answer: "Oui, les visuels exportés sont prêts pour Meta Ads, WhatsApp Business et impression locale.",
  },
  {
    question: "Comment fonctionnent les crédits ?",
    answer: "Chaque génération consomme des crédits. Vous pouvez utiliser un abonnement ou acheter des packs ponctuels.",
  },
];

export default async function Home() {
  const viewer = await getViewer();
  const isLoggedIn = Boolean(viewer?.user);

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.logoWrap}>
          <span className={styles.logo}>ASMODRA</span>
          <span className={styles.logoTag}>studio IA</span>
        </Link>
        <div className={styles.topbarNav}>
          <MainNavigation currentUser={isLoggedIn} />
        </div>
        <Link href={isLoggedIn ? "/dashboard" : "/login"} className={styles.topbarCta}>
          {isLoggedIn ? "Mon espace" : "Se connecter"}
        </Link>
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
          <div className={styles.heroStats}>
            <span className={styles.statChip}>+2 000 visuels générés</span>
            <span className={styles.statChip}>Pensé pour le marché africain</span>
            <span className={styles.statChip}>Export HD prêt à publier</span>
          </div>
        </Reveal>

        <Reveal className={styles.demoPhone} delay={0.2}>
          <div className={styles.phoneNotch} />
          <div className={styles.phoneScene}>
            <div className={styles.phoneCard}>
              <div className={styles.phoneRow}>
                <span>Forge créative...</span>
                <span className={styles.spinner}></span>
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
                <div className={styles.featureIcon}>{getFeatureIcon(feature.icon)}</div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </HoverCard>
            </Reveal>
          ))}
        </div>
      </section>

      <section className={styles.workflow}>
        <Reveal>
          <div className={styles.sectionHead}>
            <p>Comment ça marche</p>
            <h2>3 étapes pour créer une campagne visuelle efficace.</h2>
          </div>
        </Reveal>
        <div className={styles.stepGrid}>
          {processSteps.map((step, i) => (
            <Reveal key={step.title} delay={0.1 * i}>
              <HoverCard className={styles.stepCard}>
                <span className={styles.stepIndex}>0{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </HoverCard>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal className={styles.paymentBanner} delay={0.1}>
        <div className={styles.paymentGlowLeft} />
        <div className={styles.paymentGlowRight} />
        <h2>Paiement Mobile Local</h2>
        <p>Abonnez-vous instantanément en FCFA avec MTN Mobile Money ou Airtel Money, ou lancez un achat one-shot à 500 FCFA.</p>
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

      <section className={styles.socialProof}>
        <Reveal>
          <div className={styles.sectionHead}>
            <p>Ils nous font confiance</p>
            <h2>Des marques locales qui publient plus vite, et mieux.</h2>
          </div>
        </Reveal>
        <div className={styles.testimonialGrid}>
          {testimonials.map((item, i) => (
            <Reveal key={item.author} delay={0.1 * i}>
              <HoverCard className={styles.testimonialCard}>
                <p className={styles.quote}>&ldquo;{item.quote}&rdquo;</p>
                <p className={styles.author}>{item.author}</p>
                <p className={styles.authorRole}>{item.role}</p>
              </HoverCard>
            </Reveal>
          ))}
        </div>
      </section>

      <section className={styles.faq}>
        <Reveal>
          <div className={styles.sectionHead}>
            <p>FAQ</p>
            <h2>Les réponses avant de vous lancer.</h2>
          </div>
        </Reveal>
        <div className={styles.faqGrid}>
          {faqs.map((item, i) => (
            <Reveal key={item.question} delay={0.05 * i}>
              <details className={styles.faqItem}>
                <summary>{item.question}</summary>
                <p>{item.answer}</p>
              </details>
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
