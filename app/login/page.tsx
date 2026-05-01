import styles from "../auth-pages.module.css";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { ResendVerificationForm } from "@/components/resend-verification-form";
import { getViewer } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
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
          <a href="/signup">Inscription</a>
          <a href="/pricing">Tarifs</a>
          <a href="/support">Support</a>
        </nav>
      </header>

      <section className={styles.shell}>
        <p className={styles.kicker}>Connexion</p>
        <h1 className={styles.title}>Retrouve ton compte en quelques secondes</h1>
        <p className={styles.lead}>
          Connecte-toi simplement pour retrouver tes affiches, ton offre et tes
          infos.
        </p>
        <AuthForm mode="login" />
        <div className={styles.grid2}>
          <article className={styles.card}>
            <h3>Mot de passe oublie ?</h3>
            <p className={styles.meta}>
              On t&apos;envoie un lien pour choisir un nouveau mot de passe.
            </p>
            <Link href="/forgot-password" className={styles.primaryBtn}>
              Changer mon mot de passe
            </Link>
          </article>
          <article className={styles.card}>
            <h3>Email non recu ?</h3>
            <p className={styles.meta}>
              Renvoye simplement le message si tu n&apos;as pas pu valider ton compte.
            </p>
            <ResendVerificationForm email="" />
          </article>
        </div>
        <div className={styles.buttonRow}>
          <a href="/signup" className={styles.ghostBtn}>
            Je cree mon compte
          </a>
        </div>
      </section>
    </main>
  );
}
