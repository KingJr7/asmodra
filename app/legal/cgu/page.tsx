import styles from "../../shared-page.module.css";
import Link from "next/link";

export default function CguPage() {
  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.logo}>
          ASMODRA
        </Link>
        <nav className={styles.nav}>
          <a href="/legal/privacy">Confidentialité</a>
          <a href="/legal/mentions">Mentions</a>
        </nav>
      </header>

      <section className={styles.shell}>
        <p className={styles.kicker}>Chapitre 08 · Legal</p>
        <h1 className={styles.title}>Conditions generales d&apos;utilisation</h1>
        <ul className={styles.list}>
          <li>Usage autorise pour creations marketing legales et conformes.</li>
          <li>Responsabilite utilisateur sur contenu saisi et diffuse.</li>
          <li>Quota mensuel selon plan actif.</li>
          <li>Renouvellement manuel des plans payants.</li>
        </ul>
      </section>
    </main>
  );
}
