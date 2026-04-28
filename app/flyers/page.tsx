import styles from "../shared-page.module.css";
import Link from "next/link";
import { requireOnboardedUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { FlyersGalleryGrid } from "@/components/flyers-gallery-grid";

function getFormatLabel(format: string) {
  if (format === "story") return "1080x1920";
  if (format === "print") return "A4 print";
  return "1080x1080";
}

export default async function FlyersPage() {
  const viewer = await requireOnboardedUser();
  const admin = createAdminClient();
  const { data: generations } = await admin
    .from("generation_audits")
    .select("id, format, output_asset_path, metadata, created_at")
    .eq("user_id", viewer.profile.id)
    .eq("status", "completed")
    .not("output_asset_path", "is", null)
    .order("created_at", { ascending: false })
    .limit(24);

  const rows = await Promise.all(
    (generations ?? []).map(async (item) => {
      const assetPath = item.output_asset_path as string | null;
      if (!assetPath) return null;
      const { data: signed } = await admin.storage
        .from("brand-assets")
        .createSignedUrl(assetPath, 60 * 60 * 24);
      const metadata =
        item.metadata && typeof item.metadata === "object"
          ? (item.metadata as Record<string, unknown>)
          : {};
      const title =
        typeof metadata.title === "string" && metadata.title.trim()
          ? metadata.title
          : "Affiche generee";

      return {
        id: item.id as string,
        title,
        format: getFormatLabel(String(item.format ?? "square")),
        imageUrl: signed?.signedUrl ?? null,
      };
    }),
  );
  const flyers = rows.filter((row): row is NonNullable<typeof row> => Boolean(row?.imageUrl));

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/" className={styles.logo}>
          ASMODRA
        </Link>
        <nav className={styles.nav}>
          <a href="/generate">Creation</a>
          <a href="/pricing">Tarifs</a>
          <a href="/dashboard">Mon espace</a>
        </nav>
      </header>

      <section className={styles.shell}>
        <p className={styles.kicker}>Galerie</p>
        <h1 className={styles.title}>Tes affiches generees</h1>
        <p className={styles.lead}>
          Retrouve ici toutes tes generations recentes, avec telechargement direct.
        </p>
        <FlyersGalleryGrid flyers={flyers} />
        <div className={styles.footerLinks}>
          <a href="/generate">Creer la mienne</a>
          <a href="/pricing">Voir les offres</a>
          <Link href="/">Retour accueil</Link>
        </div>
      </section>
    </main>
  );
}
