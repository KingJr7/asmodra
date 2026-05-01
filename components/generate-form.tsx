"use client";

import { useMemo, useState, type FormEvent } from "react";
import Image from "next/image";
import type { GenerationRefinementQuestion } from "@/lib/types";
import styles from "./forms.module.css";

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
  const [status, setStatus] = useState("");
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
    if (message.includes("RATE_LIMITED")) {
      return "Tu as fait trop d'essais d'un coup. Attends quelques minutes puis relance.";
    }

    if (message.includes("QUOTA_EXCEEDED") || message.includes("Quota mensuel")) {
      return "Credits insuffisants pour cette generation. Recharge ton solde ou reduis les uploads.";
    }

    if (message.includes("CREDITS_EXCEEDED")) {
      return "Cette generation demande plus de credits que ton solde actuel.";
    }

    if (message.includes("INVALID_FILE_TYPE")) {
      return "Le format d'image charge n'est pas accepte. Utilise PNG, JPG ou WEBP.";
    }

    if (message.includes("FILE_TOO_LARGE")) {
      return "Une image depasse la taille autorisee.";
    }

    if (message.includes("OPENROUTER_ERROR:402")) {
      return "La reserve de creation est vide pour le moment. Recharge le compte principal puis reessaie.";
    }

    if (message.includes("OPENROUTER_ERROR")) {
      return "Le moteur IA n'a pas repondu correctement. Reessaie avec un brief plus simple.";
    }

    if (message.includes("Puter n'est pas configure")) {
      return message;
    }

    if (message.includes("Puter a refuse l'authentification")) {
      return message;
    }

    if (message.includes("Puter")) {
      return "Le moteur Puter n'a pas repondu correctement. Reessaie ou repasse sur OpenRouter.";
    }

    if (message.includes("POLLINATIONS_ERROR")) {
      return "Le moteur Pollinations n'a pas repondu correctement. Reessaie ou change de provider.";
    }

    if (message.includes("Pollinations n'est pas configure")) {
      return message;
    }

    if (message.includes("Supabase")) {
      return "La plateforme n'est pas encore configuree completement.";
    }

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
    setStatus("");
    setLoading(true);
    setGenerationDone(false);
    setResult(null);

    if (questionAnswers.length > 0) {
      formData.set("refinement_answers", JSON.stringify(questionAnswers));
    } else {
      formData.delete("refinement_answers");
    }

    const response = await fetch("/api/generate", {
      method: "POST",
      body: formData,
    });

    const payload = await response.json();
    if (!response.ok) {
      setLoading(false);
      setError(normalizeError(payload.error ?? "La generation a echoue."));
      return;
    }

    setGenerationDone(true);
    setTimeout(() => {
      setLoading(false);
      setGenerationDone(false);
    }, 1200);
    setStatus(payload.statusLabel ?? "Generation terminee.");
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
  }

  async function dataUrlToFile(dataUrl: string, filename: string) {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type || "image/webp" });
  }

  async function handleRevision() {
    if (!result || !lastRequest || !revisionNote.trim()) return;
    setError("");
    setStatus("");
    setLoading(true);
    const form = new FormData();
    form.set("product", lastRequest.product);
    form.set("format", lastRequest.format);
    form.set("must_display_info", lastRequest.mustDisplayInfo);
    form.set("dominant_color", lastRequest.dominantColor);
    if (lastRequest.refinementAnswersJson) form.set("refinement_answers", lastRequest.refinementAnswersJson);
    form.set("idea", `Corrige l'affiche existante selon ces demandes: ${revisionNote.trim()}`);
    form.set("custom_prompt", lastRequest.customPrompt);
    form.append("examples", await dataUrlToFile(result.imageDataUrl, "revision-source.webp"));
    const response = await fetch("/api/generate", { method: "POST", body: form });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(normalizeError(payload.error ?? "La correction a echoue."));
      return;
    }
    setStatus(payload.statusLabel ?? "Correction terminee.");
    setResult(payload);
  }

  async function startRefinement(formData: FormData) {
    setError("");
    setStatus("");
    setQuestionLoading(true);

    const response = await fetch("/api/generate/questions", {
      method: "POST",
      body: formData,
    });

    const payload = await response.json();
    setQuestionLoading(false);

    if (!response.ok) {
      setError(normalizeError(payload.error ?? "Impossible de preparer les questions."));
      return;
    }

    const questions = Array.isArray(payload.questions)
      ? (payload.questions as GenerationRefinementQuestion[]).slice(0, 10)
      : [];

    if (questions.length === 0) {
      await runGeneration(formData, []);
      return;
    }

    setRefinementQuestions(questions);
    setRefinementAnswers(
      questions.map((question) =>
        question.type === "single_choice" ? question.options[0] ?? "" : "",
      ),
    );
    setQuestionIndex(0);
    setPendingFormData(formData);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    closeQuestionFlow();
    await startRefinement(new FormData(event.currentTarget));
  }

  async function handleQuestionNext() {
    if (!currentQuestion || !pendingFormData) {
      return;
    }

    const currentAnswer = (refinementAnswers[questionIndex] ?? "").trim();
    if (!currentAnswer) {
      setError("Reponds a la question avant de continuer.");
      return;
    }

    setError("");

    if (questionIndex < refinementQuestions.length - 1) {
      setQuestionIndex((value) => value + 1);
      return;
    }

    const payload = buildRefinementPayload(refinementQuestions, refinementAnswers);
    closeQuestionFlow();
    await runGeneration(pendingFormData, payload);
  }

  function handleQuestionBack() {
    if (questionIndex === 0) {
      return;
    }

    setQuestionIndex((value) => value - 1);
  }

  function updateCurrentAnswer(value: string) {
    setRefinementAnswers((current) => {
      const next = [...current];
      next[questionIndex] = value;
      return next;
    });
  }

  return (
    <div className={styles.stack}>
      <form className={`${styles.panel} ${styles.stack}`} onSubmit={handleSubmit}>
        <div className={styles.row}>
          <div>
            <label className={styles.label} htmlFor="product">
              Ce que tu veux mettre en avant
            </label>
            <input
              id="product"
              name="product"
              className={styles.input}
              placeholder="Ex: Promo coiffure + brushing, Pack burger duo, Vente de parcelles..."
              required
            />
          </div>
          <div>
            <label className={styles.label} htmlFor="format">
              Format
            </label>
            <select id="format" name="format" className={styles.select} defaultValue="square">
              <option value="square">Carre 1080x1080</option>
              <option value="story">Story 1080x1920</option>
              <option value="print">Affiche print</option>
            </select>
          </div>
        </div>

        <div>
          <label className={styles.label} htmlFor="idea">
            Dis-nous ce que tu veux
          </label>
          <textarea
            id="idea"
            name="idea"
            className={styles.textarea}
            placeholder="Ex: Je veux une affiche tres visible pour attirer de nouveaux clients ce week-end, avec un titre percutant, une offre claire et un CTA WhatsApp."
            required
          />
        </div>

        <div>
          <label className={styles.label} htmlFor="must_display_info">
            Infos essentielles a afficher absolument
          </label>
          <textarea
            id="must_display_info"
            name="must_display_info"
            className={styles.textarea}
            placeholder="Ex: Nom du commerce, reduction -30%, date limite 30 Avril, numero WhatsApp 06 XX XX XX, adresse exacte."
          />
        </div>

        <div className={styles.row}>
          <div>
            <label className={styles.label} htmlFor="dominant_color">
              Couleur principale de l&apos;affiche
            </label>
            <input
              id="dominant_color"
              name="dominant_color"
              className={styles.input}
              placeholder="Ex: bleu royal, rouge vif, vert emeraude..."
            />
          </div>
          <div>
            <label className={styles.label} htmlFor="custom_prompt">
              Precisions en plus
            </label>
            <textarea
              id="custom_prompt"
              name="custom_prompt"
              className={styles.textarea}
              placeholder="Ex: style premium, ambiance chaleureuse, photo hero au centre, texte en haut et contact en bas."
            />
          </div>
        </div>

        <div className={styles.row}>
          <div>
            <label className={styles.label} htmlFor="references">
              Tes images
            </label>
            <input
              id="references"
              name="references"
              className={styles.file}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
            />
          </div>
          <div>
            <label className={styles.label} htmlFor="examples">
              Styles que tu aimes
            </label>
            <input
              id="examples"
              name="examples"
              className={styles.file}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
            />
          </div>
        </div>

        <p className={styles.hint}>
          Il te reste {quotaRemaining} credit(s). Signature Asmodra:{" "}
          {watermarkEnabled ? "oui" : "non"}.
        </p>

        {error ? <p className={styles.error}>{error}</p> : null}
        {status ? <p className={styles.success}>{status}</p> : null}

        <div className={styles.actions}>
          <button type="submit" className={styles.button} disabled={loading || questionLoading}>
            {loading
              ? "Creation en cours..."
              : questionLoading
                ? "Analyse de la demande..."
                : "Creer mon affiche"}
          </button>
        </div>
      </form>

      {currentQuestion ? (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <p className={styles.modalQuestion}>{currentQuestion.prompt}</p>
            {currentQuestion.type === "single_choice" ? (
              <div className={styles.modalChoices}>
                {currentQuestion.options.map((option) => (
                  <label key={option} className={styles.choiceOption}>
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      checked={(refinementAnswers[questionIndex] ?? "") === option}
                      onChange={() => updateCurrentAnswer(option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            ) : (
              <input
                className={styles.input}
                value={refinementAnswers[questionIndex] ?? ""}
                onChange={(event) => updateCurrentAnswer(event.target.value)}
                placeholder={currentQuestion.placeholder}
              />
            )}
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleQuestionBack}
                disabled={loading || questionIndex === 0}
              >
                Retour
              </button>
              <button type="button" className={styles.button} onClick={handleQuestionNext} disabled={loading}>
                {questionIndex === refinementQuestions.length - 1 ? "Generer" : "Suivant"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {result ? (
        <section className={`${styles.panel} ${styles.preview}`}>
          <button type="button" className={styles.previewZoomButton} onClick={() => setPreviewOpen(true)}>
            <Image
              src={result.imageDataUrl}
              alt={result.title}
              className={styles.imagePreview}
              width={1200}
              height={1600}
              unoptimized
            />
          </button>
          <div className={styles.actions}>
            <a
              href={result.imageDataUrl}
              download={`${(result.title || "affiche-asmodra").replace(/\s+/g, "-").toLowerCase()}.png`}
              className={styles.button}
            >
              Telecharger l&apos;affiche
            </a>
          </div>
          <textarea
            className={styles.textarea}
            value={revisionNote}
            onChange={(event) => setRevisionNote(event.target.value)}
            placeholder="Demande une modification: titre plus grand, changer couleur, corriger disposition, etc."
          />
          <div className={styles.actions}>
            <button type="button" className={styles.secondaryButton} disabled={loading || !revisionNote.trim()} onClick={handleRevision}>
              {loading ? "Correction..." : "Modifier cette affiche"}
            </button>
          </div>
        </section>
      ) : null}
      {result && previewOpen ? (
        <div className={styles.modalBackdrop} onClick={() => setPreviewOpen(false)}>
          <button type="button" className={styles.secondaryButton} onClick={() => setPreviewOpen(false)}>
            Fermer
          </button>
          <Image
            src={result.imageDataUrl}
            alt={result.title}
            className={styles.lightboxImage}
            width={1600}
            height={2000}
            unoptimized
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      ) : null}
      {loading || questionLoading ? (
        <div className={styles.generationOverlay}>
          <div className={styles.generationCard}>
            <div className={styles.generationOrb} />
            <p className={styles.generationTitle}>
              {generationDone ? "Generation terminee" : questionLoading ? "Analyse de la demande..." : "Generation en cours..."}
            </p>
            {!generationDone && !questionLoading ? (
              <>
                <p className={styles.generationText}>
                  L&apos;IA construit ton affiche, ajuste la composition et prepare un rendu propre.
                </p>
                <div className={styles.generationTrack}>
                  <div className={styles.generationFill} />
                </div>
                <div className={styles.generationDots}>
                  <span />
                  <span />
                  <span />
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
