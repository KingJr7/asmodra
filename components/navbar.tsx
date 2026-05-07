import { MainNavigation } from "@/components/main-navigation";
import { getViewer } from "@/lib/auth";
import styles from "./navbar.module.css";
import Link from "next/link";

export async function Navbar() {
  const viewer = await getViewer();
  const isAdmin = viewer?.profile?.role === "admin";
  const currentUser = Boolean(viewer?.user);

  return (
    <header className={styles.topbar}>
      <Link href="/" className={styles.logo}>
        ASMODRA
      </Link>
      <MainNavigation currentUser={currentUser} isAdmin={isAdmin} />
    </header>
  );
}
