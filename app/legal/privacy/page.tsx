import styles from "../../shared-page.module.css";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.logo}>
          ASMODRA
        </Link>
        <nav className={styles.nav}>
          <a href="/legal/cgu">CGU</a>
          <a href="/legal/mentions">Mentions</a>
        </nav>
      </header>

      <section className={styles.shell}>
        <p className={styles.kicker}>Chapitre 08 · Legal</p>
        <h1 className={styles.title}>Politique de confidentialite</h1>
        <ul className={styles.list}>
          <li>Donnees de compte et activite stockees sur Supabase.</li>
          <li>Donnees de paiement traitees via Yabetoo Pay.</li>
          <li>Utilisation securisee et acces limite aux donnees personnelles.</li>
          <li>Suppression des donnees sur demande utilisateur.</li>
        </ul>
      </section>
    </main>
  );
}
