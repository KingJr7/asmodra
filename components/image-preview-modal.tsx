import Image from "next/image";
import styles from "./image-preview-modal.module.css";

interface ImagePreviewModalProps {
  url: string;
  alt: string;
  onClose: () => void;
}

export function ImagePreviewModal({ url, alt, onClose }: ImagePreviewModalProps) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>✕</button>
        <div className={styles.imageContainer}>
          <Image src={url} alt={alt} fill className={styles.image} unoptimized />
        </div>
      </div>
    </div>
  );
}
