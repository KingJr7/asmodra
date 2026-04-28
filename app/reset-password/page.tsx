import styles from "../shared-page.module.css";
import Link from "next/link";
import { PasswordUpdateForm } from "@/components/password-update-form";

export default function ResetPasswordPage() {
  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.logo}>
          ASMODRA
        </Link>
      </header>

      <section className={styles.shell}>
        <p className={styles.kicker}>Compte</p>
        <h1 className={styles.title}>Definir un nouveau mot de passe</h1>
        <p className={styles.lead}>
          Cette page est le point d&apos;arrivee du lien de reinitialisation Supabase.
        </p>
        <PasswordUpdateForm mode="reset" />
      </section>
    </main>
  );
}
