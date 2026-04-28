import styles from "../shared-page.module.css";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.logo}>
          ASMODRA
        </Link>
      </header>

      <section className={styles.shell}>
        <p className={styles.kicker}>Compte</p>
        <h1 className={styles.title}>Recuperer l&apos;acces au compte</h1>
        <p className={styles.lead}>
          Demande un lien de reinitialisation. Le nouveau mot de passe sera defini
          sur la page de retour apres validation par email.
        </p>
        <ForgotPasswordForm />
      </section>
    </main>
  );
}
