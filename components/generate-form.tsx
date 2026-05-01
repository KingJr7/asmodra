"use client";

import { useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import type { GenerationRefinementQuestion } from "@/lib/types";
import styles from "./forms.module.css";
import { Reveal } from "./motion/reveal";

type GenerateFormProps = {
  quotaRemaining: number;
  watermarkEnabled: boolean;
};

type RefinementAnswer = {
  question: string;
  answer: string;
};

export function GenerateForm({ quotaRemaining, watermarkEnabled }: GenerateFormProps) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [generationDone, setGenerationDone] = useState(false);
  const [result, setResult] = useState<null | {
    imageDataUrl: string;
    title: string;
    caption: string;
    quotaRemaining: number;
    creditsCost?: number;
    creditsCostBreakdown?: {
      formatBase: number;
      referenceCost: number;
      exampleCost: number;
      uploadWeightCost: number;
      briefComplexityCost: number;
      total: number;
    };
    watermarkApplied: boolean;
    statusLabel?: string;
    visualStrategy?: string;
    audienceAngle?: string;
    layoutStrategy?: string;
    imageDirection?: string;
  }>(null);
  const [refinementQuestions, setRefinementQuestions] = useState<GenerationRefinementQuestion[]>(
    [],
  );
  const [refinementAnswers, setRefinementAnswers] = useState<string[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");
  const [lastRequest, setLastRequest] = useState<null | {
    product: string;
    format: string;
    customPrompt: string;
    mustDisplayInfo: string;
    dominantColor: string;
    refinementAnswersJson: string;
  }>(null);

  const currentQuestion = useMemo(
    () => refinementQuestions[questionIndex] ?? null,
    [questionIndex, refinementQuestions],
  );

  function normalizeError(message: string) {
    if (message.includes("RATE_LIMITED")) return "Trop d'essais. Attends un peu.";
    if (message.includes("QUOTA_EXCEEDED")) return "Crédits insuffisants.";
    return message;
  }

  function closeQuestionFlow() {
    setRefinementQuestions([]);
    setRefinementAnswers([]);
    setQuestionIndex(0);
    setPendingFormData(null);
  }

  function buildRefinementPayload(questions: GenerationRefinementQuestion[], answers: string[]) {
    return questions
      .map((question, index) => ({
        question: question.prompt,
        answer: (answers[index] ?? "").trim(),
      }))
      .filter((entry) => entry.answer)
      .slice(0, 10);
  }

  async function runGeneration(formData: FormData, questionAnswers: RefinementAnswer[]) {
    setError("");
    setLoading(true);
    setGenerationDone(false);
    setResult(null);

    if (questionAnswers.length > 0) {
      formData.set("refinement_answers", JSON.stringify(questionAnswers));
    }

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) {
        setLoading(false);
        setError(normalizeError(payload.error ?? "Erreur de génération."));
        return;
      }

      setGenerationDone(true);
      setTimeout(() => {
        setLoading(false);
        setGenerationDone(false);
      }, 1500);
      setResult(payload);
      setLastRequest({
        product: String(formData.get("product") ?? ""),
        format: String(formData.get("format") ?? "square"),
        customPrompt: String(formData.get("custom_prompt") ?? ""),
        mustDisplayInfo: String(formData.get("must_display_info") ?? ""),
        dominantColor: String(formData.get("dominant_color") ?? ""),
        refinementAnswersJson: String(formData.get("refinement_answers") ?? ""),
      });
      setRevisionNote("");
    } catch {
      setLoading(false);
      setError("Erreur réseau.");
    }
  }

  async function dataUrlToFile(dataUrl: string, filename: string) {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type || "image/webp" });
  }

  async function handleRevision() {
    if (!result || !lastRequest || !revisionNote.trim()) return;
    setError("");
    setLoading(true);
    const form = new FormData();
    form.set("product", lastRequest.product);
    form.set("format", lastRequest.format);
    form.set("must_display_info", lastRequest.mustDisplayInfo);
    form.set("dominant_color", lastRequest.dominantColor);
    if (lastRequest.refinementAnswersJson) form.set("refinement_answers", lastRequest.refinementAnswersJson);
    form.set("idea", `Corrige l'affiche: ${revisionNote.trim()}`);
    form.set("custom_prompt", lastRequest.customPrompt);
    form.append("examples", await dataUrlToFile(result.imageDataUrl, "source.webp"));
    const response = await fetch("/api/generate", { method: "POST", body: form });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(normalizeError(payload.error ?? "Échec."));
      return;
    }
    setResult(payload);
  }

  async function startRefinement(formData: FormData) {
    setError("");
    setQuestionLoading(true);

    try {
      const response = await fetch("/api/generate/questions", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();
      setQuestionLoading(false);

      if (!response.ok) {
        setError(normalizeError(payload.error ?? "Impossible de préparer les questions."));
        return;
      }

      const questions = Array.isArray(payload.questions) ? payload.questions : [];

      if (questions.length === 0) {
        await runGeneration(formData, []);
        return;
      }

      setRefinementQuestions(questions);
      setRefinementAnswers(questions.map((q: GenerationRefinementQuestion) => q.type === "single_choice" ? q.options[0] ?? "" : ""));
      setQuestionIndex(0);
      setPendingFormData(formData);
    } catch {
      setQuestionLoading(false);
      setError("Erreur réseau.");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    closeQuestionFlow();
    await startRefinement(new FormData(event.currentTarget));
  }

  async function handleQuestionNext() {
    if (!currentQuestion || !pendingFormData) return;
    const currentAnswer = (refinementAnswers[questionIndex] ?? "").trim();
    if (!currentAnswer) {
      setError("Réponds avant de continuer.");
      return;
    }
    setError("");
    if (questionIndex < refinementQuestions.length - 1) {
      setQuestionIndex(v => v + 1);
    } else {
      const payload = buildRefinementPayload(refinementQuestions, refinementAnswers);
      closeQuestionFlow();
      await runGeneration(pendingFormData, payload);
    }
  }

  function updateCurrentAnswer(value: string) {
    setRefinementAnswers(curr => {
      const n = [...curr];
      n[questionIndex] = value;
      return n;
    });
  }

  return (
    <div className={styles.stack}>
      <form className={`${styles.panel} ${styles.stack}`} onSubmit={handleSubmit}>
        
        {/* Module 1: Le Message */}
        <div className={styles.formModule}>
          <div className={styles.moduleHeader}>
            <div className={styles.moduleIcon}>🎯</div>
            <span className={styles.moduleTitle}>Mission de l&apos;affiche</span>
          </div>
          
          <div className={styles.row}>
            <div>
              <label className={styles.label} htmlFor="product">Produit ou Service</label>
              <input id="product" name="product" className={styles.input} placeholder="Ex: Pack burger duo, Promo coiffure..." required />
            </div>
            <div>
              <label className={styles.label} htmlFor="format">Format de sortie</label>
              <select id="format" name="format" className={styles.select} defaultValue="square">
                <option value="square">Carré 1:1 (Insta/WA)</option>
                <option value="story">Story 9:16 (WA/TikTok)</option>
                <option value="print">Affiche A4/A3</option>
              </select>
            </div>
          </div>

          <div>
            <label className={styles.label} htmlFor="idea">Objectif et idée principale</label>
            <textarea id="idea" name="idea" className={styles.textarea} placeholder="Décris ce que tu veux faire ressentir..." required />
          </div>
        </div>

        {/* Module 2: Direction Artistique */}
        <div className={styles.formModule}>
          <div className={styles.moduleHeader}>
            <div className={styles.moduleIcon}>🎨</div>
            <span className={styles.moduleTitle}>Direction Artistique</span>
          </div>

          <div>
            <label className={styles.label} htmlFor="must_display_info">Informations obligatoires</label>
            <textarea id="must_display_info" name="must_display_info" className={styles.textarea} placeholder="Nom, Prix, WhatsApp, Adresse..." />
          </div>

          <div className={styles.row}>
            <div>
              <label className={styles.label} htmlFor="dominant_color">Couleur dominante</label>
              <input id="dominant_color" name="dominant_color" className={styles.input} placeholder="Ex: Bleu Royal, Or..." />
            </div>
            <div>
              <label className={styles.label} htmlFor="custom_prompt">Style ou ambiance spécifique</label>
              <input id="custom_prompt" name="custom_prompt" className={styles.input} placeholder="Ex: Luxe, Street, Épuré..." />
            </div>
          </div>
        </div>

        {/* Module 3: Assets visuels */}
        <div className={styles.formModule}>
          <div className={styles.moduleHeader}>
            <div className={styles.moduleIcon}>📸</div>
            <span className={styles.moduleTitle}>Tes ressources</span>
          </div>

          <div className={styles.row}>
            <div>
              <label className={styles.label}>Photos (Produit, Logo...)</label>
              <input name="references" className={styles.file} type="file" accept="image/*" multiple />
            </div>
            <div>
              <label className={styles.label}>Inspirations (Styles aimés)</label>
              <input name="examples" className={styles.file} type="file" accept="image/*" multiple />
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button type="submit" className={styles.button} disabled={loading || questionLoading}>
            Lancer le Studio créatif
          </button>
        </div>

        <p className={styles.hint}>
          Crédits disponibles: <strong>{quotaRemaining}</strong> • Signature Asmodra: <strong>{watermarkEnabled ? "Oui" : "Non"}</strong>
        </p>

        {error && <p className={styles.error}>{error}</p>}
      </form>

      {/* Refinement Flow */}
      {currentQuestion && (
        <div className={styles.modalBackdrop}>
          <Reveal className={styles.modalCard}>
            <div className={styles.moduleHeader}>
              <div className={styles.moduleIcon}>💡</div>
              <span className={styles.moduleTitle}>Précision nécessaire</span>
            </div>
            <p className={styles.modalQuestion}>{currentQuestion.prompt}</p>
            {currentQuestion.type === "single_choice" ? (
              <div className={styles.modalChoices}>
                {currentQuestion.options.map(option => (
                  <label key={option} className={styles.choiceOption}>
                    <input type="radio" checked={(refinementAnswers[questionIndex] ?? "") === option} onChange={() => updateCurrentAnswer(option)} />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <input className={styles.input} value={refinementAnswers[questionIndex] ?? ""} onChange={e => updateCurrentAnswer(e.target.value)} placeholder={currentQuestion.placeholder} />
            )}
            <div className={styles.modalActions}>
              <button type="button" className={styles.secondaryButton} onClick={() => setQuestionIndex(v => Math.max(0, v - 1))} disabled={questionIndex === 0}>Retour</button>
              <button type="button" className={styles.button} onClick={handleQuestionNext}>
                {questionIndex === refinementQuestions.length - 1 ? "Générer" : "Suivant"}
              </button>
            </div>
          </Reveal>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <Reveal className={styles.preview}>
          <div className={styles.panel}>
            <div className={styles.moduleHeader}>
              <div className={styles.moduleIcon}>✨</div>
              <span className={styles.moduleTitle}>Ton chef-d&apos;œuvre est prêt</span>
            </div>
            <button type="button" className={styles.previewZoomButton} onClick={() => setPreviewOpen(true)}>
              <Image src={result.imageDataUrl} alt={result.title} className={styles.imagePreview} width={1200} height={1600} unoptimized />
            </button>
            
            <div className={styles.actions}>
              <a href={result.imageDataUrl} download="asmodra-flyer.png" className={styles.button}>Télécharger en Haute Définition</a>
            </div>

            <div className={styles.formModule} style={{ marginTop: '2rem' }}>
              <div className={styles.moduleHeader}>
                <div className={styles.moduleIcon}>🛠️</div>
                <span className={styles.moduleTitle}>Retouches rapides</span>
              </div>
              <textarea className={styles.textarea} value={revisionNote} onChange={e => setRevisionNote(e.target.value)} placeholder="Un changement ? Dis-nous tout..." />
              <button type="button" className={styles.secondaryButton} disabled={loading || !revisionNote.trim()} onClick={handleRevision}>
                {loading ? "Mise à jour..." : "Appliquer la retouche"}
              </button>
            </div>
          </div>
        </Reveal>
      )}

      {/* Loading Overlay */}
      {(loading || questionLoading) && (
        <div className={styles.generationOverlay}>
          <div className={styles.generationCard}>
            <div className={styles.generationOrb} />
            <p className={styles.generationTitle}>
              {generationDone ? "Finalisation..." : questionLoading ? "Analyse stratégique..." : "Forge créative en cours..."}
            </p>
            <p className={styles.generationText}>
              L&apos;IA assemble les textures, la lumière et ta typographie pour un résultat exceptionnel.
            </p>
            <div className={styles.generationTrack}>
              <div className={styles.generationFill} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
