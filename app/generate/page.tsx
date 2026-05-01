import styles from "./generate.module.css";
import Link from "next/link";
import Image from "next/image";
import { requireOnboardedUser, computeQuotaSnapshot } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { GenerateForm } from "@/components/generate-form";
import { HoverCard, Reveal } from "@/components/motion/reveal";

const presets = [
  { name: "Minimal", tone: "presetMinimal", desc: "Épuré & Suisse" },
  { name: "Vibrant", tone: "presetVibrant", active: true, desc: "Énergie & Holi" },
  { name: "Corporate", tone: "presetCorporate", desc: "Pro & Apple-esque" },
  { name: "Artistic", tone: "presetArtistic", desc: "Peinture & Texture" },
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
    .limit(4);
    
  const recentItems = await Promise.all(
    (recents ?? []).map(async (item) => {
      const path = item.output_asset_path as string | null;
      if (!path) return null;
      const { data: signed } = await admin.storage.from("brand-assets").createSignedUrl(path, 60 * 60 * 6);
      const meta = item.metadata as Record<string, unknown> | null;
      return {
        id: String(item.id),
        title: typeof meta?.title === "string" && meta.title ? meta.title : "Affiche générée",
        imageUrl: signed?.signedUrl ?? "",
      };
    }),
  );

  return (
    <div className={styles.page}>
      {/* Mobile UI */}
      <header className={styles.mobileTopbar}>
        <Link href="/" className={styles.brandMobile}>ASMODRA</Link>
        <Link href="/dashboard" className={styles.mobileAction}>Profil</Link>
      </header>

      {/* Desktop Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>ASMODRA</div>
        <div className={styles.sidebarUser}>
          <strong>{viewer.profile.full_name?.split(' ')[0] || "Creative Pro"}</strong>
          <small>{viewer.profile.plan_id?.toUpperCase() || "STARTER"} PLAN</small>
        </div>
        <nav className={styles.sidebarNav}>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/generate" className={styles.sidebarActive}>Studio</Link>
          <Link href="/flyers">Galerie</Link>
          <Link href="/pricing">Tarifs</Link>
        </nav>
      </aside>

      <main className={styles.canvas}>
        <Reveal className={styles.pageHead}>
          <span style={{ color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.8rem' }}>Atelier de création</span>
          <h1>Studio Créatif</h1>
          <p>Donne vie à tes idées. Asmodra fusionne stratégie marketing et direction artistique pour tes visuels.</p>
        </Reveal>

        <div className={styles.bentoGrid}>
          {/* Main Workspace */}
          <div className={styles.workspace}>
            <GenerateForm
              quotaRemaining={quota.quota_remaining}
              watermarkEnabled={quota.watermark_enabled}
              isAdmin={viewer.profile.role === "admin"}
            />
          </div>

          {/* Style Control Panel */}
          <aside className={styles.controls}>
            <Reveal className={styles.presetPanel}>
              <h3>Direction de Style</h3>
              <div className={styles.presetGrid}>
                {presets.map((preset) => (
                  <button
                    type="button"
                    key={preset.name}
                    className={`${styles.presetCard} ${styles[preset.tone]} ${preset.active ? styles.presetActive : ""}`}
                  >
                    <span>{preset.name}</span>
                    {preset.active && <i className={styles.activeDot} />}
                  </button>
                ))}
              </div>
              <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: '#717082', fontStyle: 'italic' }}>
                L&apos;IA adapte sa composition selon le style choisi.
              </p>
            </Reveal>

            {/* Quick Stats / Feedback */}
            <Reveal className={styles.presetPanel} style={{ marginTop: '1.5rem' }} delay={0.2}>
              <h3>Tes crédits</h3>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fff' }}>{quota.quota_remaining}</div>
              <p style={{ fontSize: '0.8rem', color: '#717082' }}>Rechargeable à tout moment.</p>
              <Link href="/pricing" style={{ display: 'block', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>
                Prendre plus de crédits →
              </Link>
            </Reveal>
          </aside>
        </div>

        {/* History Section */}
        {recentItems.length > 0 && (
          <Reveal className={styles.recentSection} delay={0.3}>
            <div className={styles.recentHead}>
              <h3>Dernières Créations</h3>
              <Link href="/flyers">Voir la galerie complète</Link>
            </div>
            <div className={styles.recentGrid}>
              {recentItems.filter(Boolean).map((item) => (
                <HoverCard key={item!.id} className={styles.recentCard}>
                  <Image
                    src={item!.imageUrl}
                    alt={item!.title}
                    className={styles.recentVisual}
                    width={400}
                    height={400}
                    unoptimized
                  />
                  <div className={styles.recentMeta}>
                    <strong>{item!.title}</strong>
                    <span>{new Date().toLocaleDateString('fr-FR')}</span>
                  </div>
                </HoverCard>
              ))}
            </div>
          </Reveal>
        )}
      </main>

      {/* Mobile Navigation Dock */}
      <nav className={styles.mobileDock}>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/generate" className={styles.mobileActive}>Studio</Link>
        <Link href="/flyers">Galerie</Link>
        <Link href="/pricing">Tarifs</Link>
      </nav>
    </div>
  );
}
