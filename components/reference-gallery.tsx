"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import type { ReferenceImage, ReferenceKind } from "@/lib/types";
import styles from "./forms.module.css";
import { ImagePreviewModal } from "./image-preview-modal";

interface ReferenceGalleryProps {
  kind: ReferenceKind;
  label: string;
  icon: string;
  onSelectionChange: (ids: string[]) => void;
  selectedIds?: string[];
}

const getGalleryIcon = (iconName: string) => {
  const iconProps = {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (iconName) {
    case "package":
      return (
        <svg {...iconProps}>
          <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
    case "camera":
      return (
        <svg {...iconProps}>
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      );
    case "lightbulb":
      return (
        <svg {...iconProps}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "image":
      return (
        <svg {...iconProps}>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      );
    default:
      return <div />;
  }
};

export function ReferenceGallery({
  kind,
  label,
  icon,
  onSelectionChange,
  selectedIds = [],
}: ReferenceGalleryProps) {
  const [references, setReferences] = useState<Array<ReferenceImage & { previewUrl?: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));
  const [previewImage, setPreviewImage] = useState<{ url: string; alt: string } | null>(null);


  const loadReferences = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/reference-images?kind=${kind}`);
      if (!response.ok) throw new Error("Failed to load references");
      const data = await response.json();
      
      // Generate signed URLs for previews
      const refsWithPreviews = await Promise.all(
        (data.references || []).map(async (ref: ReferenceImage) => {
          try {
            const adminResponse = await fetch("/api/reference-images/preview", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ path: ref.path }),
            });
            const previewData = await adminResponse.json();
            return { ...ref, previewUrl: previewData.signedUrl };
          } catch {
            return ref;
          }
        })
      );
      
      setReferences(refsWithPreviews);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [kind]);

  useEffect(() => {
    loadReferences();
  }, [loadReferences]);

  useEffect(() => {
    onSelectionChange(Array.from(selected));
  }, [selected, onSelectionChange]);

  const handleUpload = async (files: FileList | null) => {
    if (!files) return;

    setUploading(true);
    setError("");

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("kind", kind);

        const response = await fetch("/api/reference-images", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Upload failed");
        }

        const data = await response.json();
        
        // Generate preview for new image
        let previewUrl = undefined;
        try {
          const previewResponse = await fetch("/api/reference-images/preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ path: data.reference.path }),
          });
          const previewData = await previewResponse.json();
          previewUrl = previewData.signedUrl;
        } catch (e) {
          console.error("Failed to get preview URL:", e);
        }

        setReferences((prev) => [{ ...data.reference, previewUrl }, ...prev]);

        // Auto-select newly uploaded file
        setSelected((prev) => new Set([...prev, data.reference.id]));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur d'upload");
      }
    }

    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/reference-images/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erreur de suppression");

      setReferences((prev) => prev.filter((ref) => ref.id !== id));
      setSelected((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
  };

  const toggleSelection = (id: string) => {
    setSelected((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className={styles.referenceGallery}>
      {previewImage && (
        <ImagePreviewModal
          url={previewImage.url}
          alt={previewImage.alt}
          onClose={() => setPreviewImage(null)}
        />
      )}
      <div className={styles.galleryHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ display: "flex", alignItems: "center", color: "var(--accent)" }}>{getGalleryIcon(icon)}</span>
          <label className={styles.label}>{label}</label>
        </div>
        <label className={styles.uploadButton}>
          + Ajouter
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleUpload(e.target.files)}
            disabled={uploading}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {loading ? (
        <p className={styles.hint}>Chargement...</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : references.length === 0 ? (
        <p className={styles.hint}>Aucune image pour l&apos;instant.</p>
      ) : (
        <div className={styles.referenceGrid}>
          {references.map((ref) => (
            <div key={ref.id} className={styles.referenceCard}>
              <label className={styles.referenceCardCheckbox}>
                <input
                  type="checkbox"
                  checked={selected.has(ref.id)}
                  onChange={() => toggleSelection(ref.id)}
                />
                <div 
                  className={styles.thumbnailWrapper}
                  onClick={(e) => {
                    if (ref.previewUrl) {
                      e.preventDefault();
                      setPreviewImage({ url: ref.previewUrl, alt: ref.name });
                    }
                  }}
                >
                  {ref.previewUrl ? (
                    <Image
                      src={ref.previewUrl}
                      alt={ref.name}
                      className={styles.thumbnail}
                      width={120}
                      height={120}
                      unoptimized
                    />
                  ) : (
                    <div className={styles.thumbnailPlaceholder}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    </div>
                  )}
                </div>
              </label>
              <div className={styles.referenceCardInfo}>
                <p className={styles.referenceCardName} title={ref.name}>{ref.name}</p>
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={() => handleDelete(ref.id)}
                  title="Supprimer"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {uploading && <p className={styles.hint}>Upload en cours...</p>}
    </div>
  );
}

