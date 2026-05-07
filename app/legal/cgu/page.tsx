import styles from "../../shared-page.module.css";
import { MainNavigation } from "@/components/main-navigation";
import Link from "next/link";

export default function CguPage() {
  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.logo}>
          ASMODRA
        </Link>
        <MainNavigation currentUser={true} />
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
