import styles from "../shared-page.module.css";
import Link from "next/link";

export default function SupportPage() {
  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.logo}>
          ASMODRA
        </Link>
        <nav className={styles.nav}>
          <a href="/dashboard">Mon espace</a>
          <a href="/pricing">Tarifs</a>
          <a href="/legal/cgu">CGU</a>
        </nav>
      </header>

      <section className={styles.shell}>
        <p className={styles.kicker}>Support</p>
        <h1 className={styles.title}>Besoin d&apos;aide ? On reste joignable.</h1>
        <p className={styles.lead}>
          Si tu as un souci avec ton compte, ton paiement ou une affiche, on peut
          t&apos;aider rapidement.
        </p>
        <div className={styles.buttonRow}>
          <a href="#" className={styles.primaryBtn}>
            Ouvrir WhatsApp
          </a>
          <a href="/dashboard" className={styles.ghostBtn}>
            Retour a mon espace
          </a>
        </div>
      </section>
    </main>
  );
}
