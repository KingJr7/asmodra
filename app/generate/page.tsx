import styles from "./generate.module.css";
import Link from "next/link";
import Image from "next/image";
import { requireOnboardedUser, computeQuotaSnapshot } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { GenerateForm } from "@/components/generate-form";
import { HoverCard, Reveal } from "@/components/motion/reveal";

const presets = [
  { name: "Minimal", tone: "presetMinimal" },
  { name: "Vibrant", tone: "presetVibrant", active: true },
  { name: "Corporate", tone: "presetCorporate" },
  { name: "Artistic", tone: "presetArtistic" },
];

export default async function GeneratePage() {
  const viewer = await requireOnboardedUser();
  const quota = computeQuotaSnapshot(viewer.profile);
  const admin = createAdminClient();
  const { data: recents } = await admin
    .from("generation_audits")
    .select("id, metadata, output_asset_path")
    .not("output_asset_path", "is", null)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(8);
  const recentItems = await Promise.all(
    (recents ?? []).map(async (item) => {
      const path = item.output_asset_path as string | null;
      if (!path) return null;
      const { data: signed } = await admin.storage.from("brand-assets").createSignedUrl(path, 60 * 60 * 6);
      const meta = item.metadata as Record<string, unknown> | null;
      return {
        id: String(item.id),
        title: typeof meta?.title === "string" && meta.title ? meta.title : "Affiche generee",
        imageUrl: signed?.signedUrl ?? "",
      };
    }),
  );

  return (
    <div className={styles.page}>
      <header className={styles.mobileTopbar}>
        <Link href="/" className={styles.brandMobile}>
          ASMODRA
        </Link>
        <Link href="/dashboard" className={styles.mobileAction}>
          Dashboard
        </Link>
      </header>

      <nav className={styles.sidebar}>
        <div className={styles.sidebarBrand}>ASMODRA</div>
        <div className={styles.sidebarUser}>
          <strong>{viewer.profile.full_name ?? "Creative Pro"}</strong>
          <small>Plan actif</small>
        </div>
        <div className={styles.sidebarNav}>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/generate" className={styles.sidebarActive}>
            Generate
          </Link>
          <Link href="/flyers">Galerie</Link>
          <Link href="/pricing">Tarifs</Link>
          <Link href="/support">Support</Link>
        </div>
      </nav>

      <main className={styles.canvas}>
        <Reveal className={styles.pageHead}>
          <h1>Create New Flyer</h1>
          <p>Decris ton besoin, selectionne un style, puis lance une generation propre et rapide.</p>
        </Reveal>

        <Reveal className={styles.bentoGrid} delay={0.06}>
          <HoverCard className={styles.generatePanel}>
            <div className={styles.panelHead}>
              <span className={styles.panelDot} />
              <h2>Brief de creation</h2>
            </div>
            <GenerateForm
              quotaRemaining={quota.quota_remaining}
              watermarkEnabled={quota.watermark_enabled}
            />
          </HoverCard>

          <Reveal className={styles.presetPanel} delay={0.1}>
            <h3>Style presets</h3>
            <div className={styles.presetGrid}>
              {presets.map((preset) => (
                <button
                  type="button"
                  key={preset.name}
                  className={`${styles.presetCard} ${styles[preset.tone]} ${preset.active ? styles.presetActive : ""}`}
                >
                  <span>{preset.name}</span>
                  {preset.active ? <i className={styles.activeDot} /> : null}
                </button>
              ))}
            </div>
          </Reveal>
        </Reveal>

        <Reveal className={styles.recentSection} delay={0.12}>
          <div className={styles.recentHead}>
            <h3>Recent generations</h3>
            <Link href="/flyers">Voir tout</Link>
          </div>
          <div className={styles.recentGrid}>
            {recentItems.filter(Boolean).slice(0, 4).map((item) => (
              <HoverCard key={item!.id} className={styles.recentCard}>
                <Image
                  src={item!.imageUrl}
                  alt={item!.title}
                  className={styles.recentVisual}
                  width={1200}
                  height={1600}
                  unoptimized
                />
                <div className={styles.recentMeta}>
                  <strong>{item!.title}</strong>
                  <span>Generation recente</span>
                </div>
              </HoverCard>
            ))}
            <HoverCard className={`${styles.recentCard} ${styles.moreCard}`}>
              <div className={styles.moreIcon}>＋</div>
              <div className={styles.recentMeta}>
                <strong>Plus de credits utilises</strong>
                <span>Explore ta galerie complete</span>
              </div>
            </HoverCard>
          </div>
        </Reveal>
      </main>

      <nav className={styles.mobileDock}>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/generate" className={styles.mobileActive}>
          Generate
        </Link>
        <Link href="/flyers">Galerie</Link>
        <Link href="/pricing">Tarifs</Link>
      </nav>
    </div>
  );
}
