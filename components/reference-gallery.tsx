"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import type { ReferenceImage, ReferenceKind } from "@/lib/types";
import styles from "./forms.module.css";

interface ReferenceGalleryProps {
  kind: ReferenceKind;
  label: string;
  icon: string;
  onSelectionChange: (ids: string[]) => void;
  selectedIds?: string[];
}

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
      <div className={styles.galleryHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>{icon}</span>
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
                <div className={styles.thumbnailWrapper}>
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
                      <span>📷</span>
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

