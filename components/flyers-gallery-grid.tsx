"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "@/app/shared-page.module.css";

type FlyerItem = {
  id: string;
  title: string;
  format: string;
  imageUrl: string;
};

export function FlyersGalleryGrid({ flyers }: { flyers: FlyerItem[] }) {
  const [active, setActive] = useState<FlyerItem | null>(null);

  return (
    <>
      <div className={styles.grid3}>
        {flyers.length > 0 ? (
          flyers.map((flyer) => (
            <article key={flyer.id} className={styles.card}>
              <button type="button" className={styles.flyerZoomButton} onClick={() => setActive(flyer)}>
                <Image
                  src={flyer.imageUrl}
                  alt={flyer.title}
                  className={styles.flyerThumb}
                  width={1200}
                  height={1600}
                  unoptimized
                />
              </button>
              <h3>{flyer.title}</h3>
              <p className={styles.meta}>{flyer.format}</p>
              <a
                href={flyer.imageUrl}
                download={`${flyer.title.replace(/\s+/g, "-").toLowerCase()}.png`}
                className={styles.pill}
              >
                Telecharger
              </a>
            </article>
          ))
        ) : (
          <article className={styles.card}>
            <h3>Aucune affiche pour le moment</h3>
            <p className={styles.meta}>Lance une generation pour remplir ta galerie.</p>
          </article>
        )}
      </div>

      {active ? (
        <div className={styles.lightboxBackdrop} onClick={() => setActive(null)}>
          <button type="button" className={styles.lightboxClose} onClick={() => setActive(null)}>
            Fermer
          </button>
          <Image
            src={active.imageUrl}
            alt={active.title}
            className={styles.lightboxImage}
            width={1600}
            height={2000}
            unoptimized
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
    </>
  );
}
