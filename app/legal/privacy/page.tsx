import styles from "../../shared-page.module.css";
import { MainNavigation } from "@/components/main-navigation";
import Link from "next/link";

export default function PrivacyPage() {
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
