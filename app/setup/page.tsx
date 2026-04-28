import styles from "../shared-page.module.css";
import Link from "next/link";

export default function SetupPage() {
  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.logo}>
          ASMODRA
        </Link>
      </header>

      <section className={styles.shell}>
        <p className={styles.kicker}>Configuration requise</p>
        <h1 className={styles.title}>La plateforme n&apos;est pas encore branchée</h1>
        <p className={styles.lead}>
          Les variables Supabase publiques sont manquantes. Ajoute
          `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` dans
          `.env.local`, puis relance le serveur.
        </p>
        <div className={styles.buttonRow}>
          <Link href="/" className={styles.primaryBtn}>
            Retour accueil
          </Link>
        </div>
      </section>
    </main>
  );
}
