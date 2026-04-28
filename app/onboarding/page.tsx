import styles from "../shared-page.module.css";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { OnboardingForm } from "@/components/onboarding-form";

export default async function OnboardingPage() {
  const viewer = await requireUser();

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.logo}>
          ASMODRA
        </Link>
      </header>

      <section className={styles.shell}>
        <p className={styles.kicker}>Ton profil</p>
        <h1 className={styles.title}>Parle-nous un peu de ton activite</h1>
        <p className={styles.lead}>
          Ces informations nous aident a creer des affiches plus justes, plus
          belles et plus proches de ton image.
        </p>
        <OnboardingForm profile={viewer.profile} />
      </section>
    </main>
  );
}
