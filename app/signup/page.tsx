import styles from "../auth-pages.module.css";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { getViewer } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SignupPage() {
  const viewer = await getViewer();
  if (viewer?.user) {
    redirect("/dashboard");
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.logo}>
          ASMODRA
        </Link>
        <nav className={styles.nav}>
          <a href="/login">Connexion</a>
          <a href="/pricing">Tarifs</a>
          <a href="/legal/privacy">Confidentialité</a>
        </nav>
      </header>

      <section className={styles.shell}>
        <p className={styles.kicker}>Inscription</p>
        <h1 className={styles.title}>Cree ton compte et lance ta premiere affiche</h1>
        <p className={styles.lead}>
          Commence avec Google ou avec ton email. Ensuite, tu completes ton profil
          et tu peux creer tes premiers visuels.
        </p>
        <AuthForm mode="signup" />
        <div className={styles.buttonRow}>
          <a href="/pricing" className={styles.ghostBtn}>
            Voir les offres
          </a>
        </div>
      </section>
    </main>
  );
}
