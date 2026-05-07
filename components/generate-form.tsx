"use client";

import { useMemo, useState, useEffect, type FormEvent } from "react";
import Image from "next/image";
import type { GenerationRefinementQuestion, ReferenceKind } from "@/lib/types";
import { computeCreditsCost } from "@/lib/credits";
import { ReferenceGallery } from "./reference-gallery";
import { CreditPurchaseModal } from "./credit-purchase-modal";
import styles from "./forms.module.css";
import { Reveal } from "./motion/reveal";

// SVG Icon renderer
const getModuleIcon = (iconName: string) => {
  const iconProps = {
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (iconName) {
    case "target":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="6" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case "palette":
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
          <circle cx="7" cy="7" r="2" fill="currentColor" />
          <circle cx="17" cy="7" r="2" fill="currentColor" />
          <circle cx="7" cy="17" r="2" fill="currentColor" />
          <circle cx="17" cy="17" r="2" fill="currentColor" />
        </svg>
      );
    case "camera":
      return (
        <svg {...iconProps}>
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      );
    case "package":
      return (
        <svg {...iconProps}>
          <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
    case "lightbulb":
      return (
        <svg {...iconProps}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case "scroll":
      return (
        <svg {...iconProps}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      );
    case "sparkles":
      return (
        <svg {...iconProps}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" />
        </svg>
      );
    case "tool":
      return (
        <svg {...iconProps}>
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 1 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
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

type GenerateFormProps = {
  quotaRemaining: number;
  watermarkEnabled: boolean;
  isAdmin: boolean;
};

type RefinementAnswer = {
  question: string;
  answer: string;
};

export function GenerateForm({ quotaRemaining, watermarkEnabled, isAdmin }: GenerateFormProps) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [generationDone, setGenerationDone] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditsNeeded, setCreditsNeeded] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);

  // Add this effect to cycle through loading steps
  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }
    const steps = [
      "Analyse stratégique...",
      "Assemblage visuel...",
      "Application du style...",
      "Traitement des textures...",
      "Finalisation..."
    ];
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 4000); // Change step every 4 seconds
    return () => clearInterval(interval);
  }, [loading]);

  const loadingSteps = [
    "Analyse stratégique...",
    "Assemblage visuel...",
    "Application du style...",
    "Traitement des textures...",
    "Finalisation..."
  ];
  
  // Form state for cost calculation
  const [format, setFormat] = useState<"square" | "story" | "print">("square");
  const [customPrompt, setCustomPrompt] = useState("");
  
  // Reference selections
  const [selectedLogos, setSelectedLogos] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedStyleGuides, setSelectedStyleGuides] = useState<string[]>([]);
  
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
  const [promptOnlyMode, setPromptOnlyMode] = useState(false);
  const [debugPrompt, setDebugPrompt] = useState("");
  const [revisionNote, setRevisionNote] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [lastRequest, setLastRequest] = useState<null | {
    product: string;
    format: string;
    customPrompt: string;
    mustDisplayInfo: string;
    dominantColor: string;
    refinementAnswersJson: string;
  }>(null);

  // Calculate estimated cost dynamically
  const estimatedCost = useMemo(() => {
    const breakdown = computeCreditsCost({
      format,
      referencesCount: selectedLogos.length + selectedProducts.length + selectedStyleGuides.length,
      referencesBreakdown: [
        ...selectedLogos.map(() => ({ kind: "logo" as ReferenceKind })),
        ...selectedProducts.map(() => ({ kind: "product" as ReferenceKind })),
        ...selectedStyleGuides.map(() => ({ kind: "style_guide" as ReferenceKind })),
      ],
      examplesCount: 0,
      totalUploadBytes: 0,
      hasCustomPrompt: customPrompt.trim() ? true : false,
    });
    return breakdown;
  }, [format, customPrompt, selectedLogos, selectedProducts, selectedStyleGuides]);

  const currentQuestion = useMemo(
    () => refinementQuestions[questionIndex] ?? null,
    [questionIndex, refinementQuestions],
  );

  function normalizeError(message: string) {
    if (message.includes("RATE_LIMITED")) return "Trop d'essais. Attends un peu.";
    if (message.includes("QUOTA_EXCEEDED")) {
      // Don't return here, we'll handle it specially
      return "QUOTA_EXCEEDED";
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
    setLoading(true);
    setGenerationDone(false);
    setResult(null);

    if (questionAnswers.length > 0) {
      formData.set("refinement_answers", JSON.stringify(questionAnswers));
    }

    if (promptOnlyMode) {
      formData.set("prompt_only", "true");
    }

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();
      setLoading(false);
      
      if (!response.ok) {
        const errorMsg = normalizeError(payload.error ?? "Erreur de génération.");
        if (errorMsg === "QUOTA_EXCEEDED") {
          // Show credit purchase modal
          setCreditsNeeded(estimatedCost.total);
          setShowCreditModal(true);
          setError("");
        } else {
          setError(errorMsg);
        }
        return;
      }

      if (promptOnlyMode) {
        setDebugPrompt(payload.improvedPrompt || "");
        setPromptOnlyMode(false);
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
    const formData = new FormData(event.currentTarget);
    
    // Ensure format is set
    formData.set("format", format);
    formData.set("custom_prompt", customPrompt);
    
    // Add reference IDs
    selectedLogos.forEach(id => formData.append("reference_ids", id));
    selectedProducts.forEach(id => formData.append("reference_ids", id));
    selectedStyleGuides.forEach(id => formData.append("reference_ids", id));
    
    await startRefinement(formData);
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
            <div className={styles.moduleIcon}>{getModuleIcon("target")}</div>
            <span className={styles.moduleTitle}>Mission de l&apos;affiche</span>
          </div>
          
          <div className={styles.row}>
            <div>
              <label className={styles.label} htmlFor="product">Produit ou Service</label>
              <input id="product" name="product" className={styles.input} placeholder="Ex: Pack burger duo, Promo coiffure..." required />
            </div>
          <div className={styles.row}>
            <div>
              <label className={styles.label} htmlFor="format">Format de sortie</label>
              <select 
                id="format" 
                name="format" 
                className={styles.select} 
                value={format}
                onChange={(e) => setFormat(e.target.value as "square" | "story" | "print")}
                defaultValue="square"
              >
                <option value="square">Carré 1:1 (Insta/WA)</option>
                <option value="story">Story 9:16 (WA/TikTok)</option>
                <option value="print">Affiche A4/A3</option>
              </select>
            </div>
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
            <div className={styles.moduleIcon}>{getModuleIcon("palette")}</div>
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
              <input 
                id="custom_prompt" 
                name="custom_prompt" 
                className={styles.input} 
                placeholder="Ex: Luxe, Street, Épuré..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Module 3: Assets visuels */}
        <div className={styles.formModule}>
          <div className={styles.moduleHeader}>
            <div className={styles.moduleIcon}>{getModuleIcon("camera")}</div>
            <span className={styles.moduleTitle}>Tes ressources</span>
          </div>

          <ReferenceGallery
            kind="logo"
            label="Logo Professionnel"
            icon="package"
            selectedIds={selectedLogos}
            onSelectionChange={setSelectedLogos}
          />

          <ReferenceGallery
            kind="product"
            label="Photos Produit"
            icon="camera"
            selectedIds={selectedProducts}
            onSelectionChange={setSelectedProducts}
          />

          <ReferenceGallery
            kind="style_guide"
            label="Guide de Style"
            icon="lightbulb"
            selectedIds={selectedStyleGuides}
            onSelectionChange={setSelectedStyleGuides}
          />
        </div>

        <div className={styles.actions}>
          <button 
            type="submit" 
            className={styles.button} 
            disabled={loading || questionLoading}
            onClick={() => setPromptOnlyMode(false)}
          >
            Lancer le Studio créatif
          </button>
          {isAdmin && (
            <button 
              type="submit" 
              className={styles.secondaryButton} 
              disabled={loading || questionLoading}
              onClick={() => {
                setPromptOnlyMode(true);
                setDebugPrompt("");
              }}
            >
              Concevoir le prompt
            </button>
          )}
        </div>

        {debugPrompt && (
          <Reveal className={styles.formModule} style={{ border: '1px solid var(--accent)', background: 'rgba(210, 187, 255, 0.05)' }}>
            <div className={styles.moduleHeader}>
              <div className={styles.moduleIcon}>{getModuleIcon("scroll")}</div>
              <span className={styles.moduleTitle}>Prompt Technique (Debug)</span>
            </div>
            <pre style={{ 
              whiteSpace: 'pre-wrap', 
              fontSize: '0.85rem', 
              color: '#d1cedb', 
              background: '#000', 
              padding: '1rem', 
              borderRadius: '12px',
              fontFamily: 'monospace' 
            }}>
              {debugPrompt}
            </pre>
            <button 
              type="button" 
              className={styles.secondaryButton} 
              style={{ marginTop: '1rem', width: 'fit-content' }}
              onClick={() => {
                navigator.clipboard.writeText(debugPrompt);
                alert("Prompt copié !");
              }}
            >
              Copier le prompt
            </button>
          </Reveal>
        )}

        <p className={styles.hint}>
          Affiches disponibles: <strong>{Math.floor(quotaRemaining / 8)}</strong> • Coût estimé: <strong>{Math.floor(estimatedCost.total / 8)}</strong> affiche{Math.floor(estimatedCost.total / 8) > 1 ? "s" : ""} • Signature Asmodra: <strong>{watermarkEnabled ? "Oui" : "Non"}</strong>
        </p>

        {error && <p className={styles.error}>{error}</p>}
      </form>

      {/* Refinement Flow */}
      {currentQuestion && (
        <div className={styles.modalBackdrop}>
          <Reveal className={styles.modalCard}>
            <div className={styles.moduleHeader}>
              <div className={styles.moduleIcon}>{getModuleIcon("lightbulb")}</div>
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
              <div className={styles.moduleIcon}>{getModuleIcon("sparkles")}</div>
              <span className={styles.moduleTitle}>Ton chef-d&apos;œuvre est prêt</span>
            </div>
            <button type="button" className={styles.previewZoomButton} onClick={() => setPreviewOpen(true)}>
              <Image src={result.imageDataUrl} alt={result.title} className={`${styles.imagePreview} ${styles.resultImagePreview}`} width={1200} height={1600} unoptimized />
            </button>
            
            <div className={styles.actions}>
              <a href={result.imageDataUrl} download="asmodra-flyer.png" className={styles.button}>Télécharger en Haute Définition</a>
            </div>

            <div className={styles.formModule} style={{ marginTop: '2rem' }}>
              <div className={styles.moduleHeader}>
                <div className={styles.moduleIcon}>{getModuleIcon("tool")}</div>
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

      {result && previewOpen && (
        <div className={styles.modalBackdrop} onClick={() => setPreviewOpen(false)}>
          <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
            <Image
              src={result.imageDataUrl}
              alt={result.title}
              className={styles.imagePreview}
              width={1200}
              height={1600}
              unoptimized
            />
            <button type="button" className={styles.secondaryButton} onClick={() => setPreviewOpen(false)}>
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {(loading || questionLoading) && (
        <div className={styles.generationOverlay}>
          <div className={styles.generationCard}>
            <div className={styles.generationOrb} />
            <p className={styles.generationTitle}>
              {generationDone 
                ? "Finalisation..." 
                : questionLoading 
                  ? "Analyse stratégique..." 
                  : loadingSteps[loadingStep]
              }
            </p>
            <p className={styles.generationText}>
              {generationDone 
                ? "Presque prêt !" 
                : questionLoading 
                  ? "Nous préparons les meilleures questions pour affiner ta vision."
                  : "L&apos;IA assemble les textures, la lumière et ta typographie pour un résultat exceptionnel."
              }
            </p>
            <div className={styles.generationTrack}>
              <div className={styles.generationFill} style={{ width: `${((loadingStep + 1) / loadingSteps.length) * 100}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Credit Purchase Modal */}
      <CreditPurchaseModal
        isOpen={showCreditModal}
        creditsNeeded={creditsNeeded}
        onClose={() => setShowCreditModal(false)}
      />
    </div>
  );
}
