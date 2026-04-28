import styles from "../../shared-page.module.css";
import Link from "next/link";

export default function MentionsPage() {
  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.logo}>
          ASMODRA
        </Link>
        <nav className={styles.nav}>
          <a href="/legal/cgu">CGU</a>
          <a href="/legal/privacy">Confidentialité</a>
        </nav>
      </header>

      <section className={styles.shell}>
        <p className={styles.kicker}>Chapitre 08 · Legal</p>
        <h1 className={styles.title}>Mentions legales</h1>
        <ul className={styles.list}>
          <li>Nom de marque: Asmodra.</li>
          <li>Service de generation de flyers par IA.</li>
          <li>Canal de support principal: WhatsApp.</li>
          <li>Zone de lancement: Congo-Brazzaville.</li>
        </ul>
      </section>
    </main>
  );
}
