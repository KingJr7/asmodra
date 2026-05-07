"use client";

import { CREDIT_PACK_LIST } from "@/lib/plans";
import styles from "./credit-purchase-modal.module.css";

type CreditPurchaseModalProps = {
  isOpen: boolean;
  creditsNeeded: number;
  onClose: () => void;
};

export function CreditPurchaseModal({
  isOpen,
  creditsNeeded,
  onClose,
}: CreditPurchaseModalProps) {
  if (!isOpen) return null;

  // Calculate how many affiches the user needs
  // ~8 credits per affiche based on the cost model
  const affichesNeeded = Math.ceil(creditsNeeded / 8);

  async function handlePurchase(packId: string) {
    try {
      const response = await fetch("/api/payments/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: packId,
          paymentMethod: "mtn_momo",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
        return;
      }

      const data = await response.json();
      // Redirect to payment or handle based on response
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        alert("Achat initié. Vérifiez votre téléphone.");
        onClose();
      }
    } catch (error) {
      alert("Erreur lors de l'achat. Réessayez.");
      console.error(error);
    }
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          ✕
        </button>

        <div className={styles.header}>
          <h2>Crédits insuffisants</h2>
          <p>
            Tu as besoin de <strong>{affichesNeeded} affiche{affichesNeeded > 1 ? "s" : ""}</strong> supplémentaire{affichesNeeded > 1 ? "s" : ""}.
          </p>
        </div>

        <div className={styles.packList}>
          {CREDIT_PACK_LIST.map((pack) => {
            const packAffiches = Math.floor(pack.credits / 8);
            const isEnough = pack.credits >= creditsNeeded;

            return (
              <button
                key={pack.id}
                className={`${styles.packCard} ${isEnough ? styles.packCardHighlight : ""}`}
                onClick={() => handlePurchase(pack.id)}
              >
                <div className={styles.packContent}>
                  <div className={styles.packMain}>
                    <h3>{pack.name}</h3>
                    <p className={styles.packGenCount}>
                      ~{packAffiches} affiche{packAffiches > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className={styles.packPrice}>
                    {pack.priceXaf.toLocaleString("fr-FR")} FCFA
                  </div>
                </div>
                {isEnough && (
                  <span className={styles.badgeEnough}>Suffisant</span>
                )}
              </button>
            );
          })}
        </div>

        <div className={styles.footer}>
          <p className={styles.hint}>Chose le pack qui te convient. Tu seras redirigé vers le paiement.</p>
          <button className={styles.cancelButton} onClick={onClose}>
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
