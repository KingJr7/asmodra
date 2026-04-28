import sharp from "sharp";
import { requireOpenRouterEnv } from "@/lib/env";
import type {
  GenerationFormat,
  GenerationRefinementQuestion,
  PromptOptimizationResult,
} from "@/lib/types";
import { hasBlockedTerms } from "@/lib/security";

type OpenRouterMessage =
  | {
      role: "system" | "assistant" | "user";
      content: string;
    }
  | {
      role: "user";
      content: Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
    };

function getAspectRatio(format: GenerationFormat) {
  if (format === "story") {
    return "9:16";
  }

  if (format === "print") {
    return "3:4";
  }

  return "1:1";
}

async function openRouterFetch(body: Record<string, unknown>) {
  const env = requireOpenRouterEnv();
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": env.APP_URL ?? "http://localhost:3000",
      "X-Title": "Asmodra",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OPENROUTER_ERROR:${response.status}:${text}`);
  }

  return response.json();
}

function findImageCandidate(value: unknown): string | null {
  const visited = new Set<unknown>();
  const queue: unknown[] = [value];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);

    if (typeof current === "string") {
      if (current.startsWith("data:image/")) {
        return current;
      }
      if (/^https?:\/\/\S+$/i.test(current)) {
        if (
          /\.(png|jpe?g|webp|gif|bmp|svg)(\?|#|$)/i.test(current) ||
          /image|img|cdn|oaiusercontent|openrouter|blob/i.test(current)
        ) {
          return current;
        }
      }
      continue;
    }

    if (Array.isArray(current)) {
      for (const entry of current) queue.push(entry);
      continue;
    }

    if (typeof current === "object") {
      for (const [key, val] of Object.entries(current as Record<string, unknown>)) {
        if (
          typeof val === "string" &&
          /^https?:\/\/\S+$/i.test(val) &&
          /image|img|url|file|asset|attachment/i.test(key)
        ) {
          return val;
        }
        queue.push(val);
      }
    }
  }

  return null;
}

function condenseImagePrompt(prompt: string) {
  const lines = prompt
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const unique = Array.from(new Set(lines));
  const compact = unique.join(". ");
  if (compact.length <= 1800) {
    return compact;
  }
  return `${compact.slice(0, 1800)}.`;
}

function parseJsonBlock<T>(value: string): T {
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("Prompt optimizer did not return JSON.");
  }

  return JSON.parse(value.slice(start, end + 1)) as T;
}

function sanitizeQuestionId(value: string, fallback: string) {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  return base || fallback;
}

function sanitizeRefinementQuestions(
  raw: unknown,
): { questions: GenerationRefinementQuestion[] } {
  if (!raw || typeof raw !== "object" || !("questions" in raw)) {
    return { questions: [] };
  }

  const payload = raw as { questions?: unknown };
  const list = Array.isArray(payload.questions) ? payload.questions : [];
  const questions: GenerationRefinementQuestion[] = [];

  for (const [index, item] of list.entries()) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const entry = item as Record<string, unknown>;
    const prompt =
      typeof entry.prompt === "string" ? entry.prompt.replace(/\s+/g, " ").trim() : "";
    const rawType = typeof entry.type === "string" ? entry.type.trim() : "";
    const type = rawType === "single_choice" ? "single_choice" : "text";
    const placeholder =
      typeof entry.placeholder === "string"
        ? entry.placeholder.trim()
        : "Exemple: donne un resultat concret, court et utile.";
    const options =
      type === "single_choice" && Array.isArray(entry.options)
        ? entry.options
            .filter((value): value is string => typeof value === "string")
            .map((value) => value.trim())
            .filter(Boolean)
            .slice(0, 8)
        : [];

    if (!prompt) {
      continue;
    }

    if (type === "single_choice" && options.length < 2) {
      continue;
    }

    questions.push({
      id: sanitizeQuestionId(
        typeof entry.id === "string" ? entry.id : "",
        `question-${index + 1}`,
      ),
      prompt,
      type,
      placeholder,
      options,
    });

    if (questions.length >= 10) {
      break;
    }
  }

  return { questions };
}

function getFormatGuidance(format: GenerationFormat) {
  if (format === "story") {
    return "Composition verticale tres lisible, impact immediate sur smartphone, hierarchie courte, zone CTA visible des les premieres secondes.";
  }

  if (format === "print") {
    return "Composition plus stable et structuree, lecture a distance, meilleur equilibre entre titre, visuel hero et details pratiques.";
  }

  return "Composition carree a fort impact, lecture rapide sur WhatsApp, Instagram et catalogues mobiles.";
}

function normalizeKeywordSource(...values: Array<string | null | undefined>) {
  return values
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function includesOneOf(source: string, keywords: string[]) {
  return keywords.some((keyword) => source.includes(keyword));
}

function inferSectorProfile(input: {
  businessCategory?: string | null;
  product: string;
  idea: string;
}) {
  const source = normalizeKeywordSource(
    input.businessCategory,
    input.product,
    input.idea,
  );

  if (
    includesOneOf(source, [
      "coiff",
      "beaute",
      "salon",
      "makeup",
      "maquillage",
      "spa",
      "parfum",
      "cosmet",
      "perruque",
      "tresse",
      "barber",
    ])
  ) {
    return {
      name: "beauty",
      strategy:
        "Mettre l'accent sur la transformation, la desirabilite, la confiance et une finition propre. Le visuel doit valoriser le resultat final avant les details techniques.",
    };
  }

  if (
    includesOneOf(source, [
      "restaurant",
      "food",
      "pizza",
      "burger",
      "grill",
      "fast food",
      "plat",
      "boisson",
      "jus",
      "catering",
      "gateau",
      "boulanger",
    ])
  ) {
    return {
      name: "food",
      strategy:
        "Donner faim immediatement avec un hero produit tres appetissant, une chaleur visuelle franche et une lecture tres rapide de l'offre.",
    };
  }

  if (
    includesOneOf(source, [
      "immobilier",
      "maison",
      "villa",
      "terrain",
      "appartement",
      "location",
      "vente",
      "bureau",
      "residence",
    ])
  ) {
    return {
      name: "real_estate",
      strategy:
        "Construire une image de confiance, de valeur et de stabilite. Prioriser la clarte de l'offre, la perception du standing et la credibilite commerciale.",
    };
  }

  if (
    includesOneOf(source, [
      "concert",
      "event",
      "evenement",
      "soir",
      "show",
      "festival",
      "anniversaire",
      "wedding",
      "mariage",
      "conference",
      "masterclass",
    ])
  ) {
    return {
      name: "event",
      strategy:
        "Creer une sensation d'energie, d'urgence et de desir de presence. Le rythme visuel doit servir la date, l'artiste, le lieu et l'appel a participer.",
    };
  }

  if (
    includesOneOf(source, [
      "formation",
      "ecole",
      "cours",
      "atelier",
      "coaching",
      "academie",
      "certification",
      "apprendre",
    ])
  ) {
    return {
      name: "education",
      strategy:
        "Faire sentir la progression, la credibilite et la promesse d'avenir. La clarte de l'information et la confiance priment sur l'effet decoratif.",
    };
  }

  if (
    includesOneOf(source, [
      "mode",
      "vetement",
      "chaussure",
      "boutique",
      "fashion",
      "pret-a-porter",
      "sac",
      "accessoire",
      "montre",
      "bijou",
    ])
  ) {
    return {
      name: "retail_fashion",
      strategy:
        "Equilibrer desir produit, style de vie et lisibilite commerciale. Le visuel doit rendre l'article memorable sans sacrifier l'offre ou le contact.",
    };
  }

  return {
    name: "general_commerce",
    strategy:
      "Rester adaptable, concret et commercial. Prioriser la comprehension immediate de l'offre, la confiance et la lisibilite mobile.",
  };
}

function inferCommercialIntent(input: {
  product: string;
  idea: string;
  customPrompt?: string;
}) {
  const source = normalizeKeywordSource(input.product, input.idea, input.customPrompt);

  if (
    includesOneOf(source, [
      "promo",
      "reduction",
      "%",
      "solde",
      "offre",
      "discount",
      "bonus",
      "gratuit",
      "cadeau",
    ])
  ) {
    return {
      name: "promotion",
      strategy:
        "Donner une priorite absolue a l'avantage commercial, au gain client et a l'urgence douce de conversion.",
    };
  }

  if (
    includesOneOf(source, [
      "lancement",
      "nouveau",
      "new",
      "opening",
      "ouverture",
      "arrivage",
      "disponible",
    ])
  ) {
    return {
      name: "launch",
      strategy:
        "Mettre en scene la nouveaute, la desirabilite et l'effet de decouverte avec une presentation fraiche et immediate.",
    };
  }

  if (
    includesOneOf(source, [
      "reservation",
      "inscription",
      "book",
      "rdv",
      "rendez-vous",
      "commande",
      "precommande",
    ])
  ) {
    return {
      name: "booking",
      strategy:
        "Structurer le visuel autour d'une action claire a faire maintenant, avec un CTA lisible et rassurant.",
    };
  }

  if (
    includesOneOf(source, [
      "premium",
      "luxe",
      "haut de gamme",
      "vip",
      "exclusive",
      "exclusif",
    ])
  ) {
    return {
      name: "premium_positioning",
      strategy:
        "Construire une perception de valeur elevee et de finition serieuse, sans tomber dans une ostentation artificielle.",
    };
  }

  return {
    name: "general_conversion",
    strategy:
      "Chercher avant tout un visuel qui aide a comprendre, faire confiance et passer a l'action rapidement.",
  };
}

function inferReferenceUsage(input: {
  referenceImagesCount?: number;
  exampleImagesCount?: number;
  customPrompt?: string;
  idea: string;
}) {
  const source = normalizeKeywordSource(input.customPrompt, input.idea);
  const references = input.referenceImagesCount ?? 0;
  const examples = input.exampleImagesCount ?? 0;

  if (references === 0 && examples === 0) {
    return "Aucune image de reference fournie. Construire la direction visuelle a partir du besoin commercial, du ton de marque et du format, sans inventer de contraintes inutiles.";
  }

  if (
    includesOneOf(source, [
      "meme produit",
      "mon produit",
      "mon visage",
      "mon logo",
      "garder",
      "respecter",
      "identique",
      "conserver",
    ])
  ) {
    return "Les references doivent etre traitees comme des ancrages d'identite ou de produit. Preserver les indices utiles de forme, de packaging, de personne, de palette ou d'univers de marque sans copier mecaniquement toute la composition.";
  }

  if (references > 0 && examples > 0) {
    return "Utiliser les references comme base de realisme ou d'identite, et les examples comme signal de style ou de mise en page. Fusionner intelligemment sans laisser les exemples ecraser le besoin commercial.";
  }

  if (references > 0) {
    return "Utiliser les references comme source principale de verite visuelle: produit, personne, ambiance, matiere ou palette. Recomposer l'annonce librement tant que ces repères restent credibles.";
  }

  return "Utiliser les examples comme orientation stylistique souple. S'inspirer de l'energie, du rythme ou de la finition, mais garder une composition au service du brief utilisateur.";
}

function inferVisualEnergy(format: GenerationFormat, idea: string, customPrompt?: string) {
  const source = normalizeKeywordSource(idea, customPrompt);

  if (
    format === "story" ||
    includesOneOf(source, ["urgent", "flash", "today", "aujourd", "ce soir", "maintenant"])
  ) {
    return "high";
  }

  if (
    includesOneOf(source, [
      "premium",
      "institutionnel",
      "corporate",
      "sobre",
      "elegant",
      "minimal",
    ])
  ) {
    return "controlled";
  }

  return "balanced";
}

function inferPaletteAndMood(input: {
  businessCategory?: string | null;
  brandTone?: string | null;
  product: string;
  idea: string;
  customPrompt?: string;
}) {
  const source = normalizeKeywordSource(
    input.businessCategory,
    input.brandTone,
    input.product,
    input.idea,
    input.customPrompt,
  );

  if (includesOneOf(source, ["rouge", "red", "bleu", "blue", "vert", "green", "jaune", "yellow", "orange", "or", "gold", "violet", "rose", "pink", "noir", "black", "blanc", "white"])) {
    return {
      palette_hint:
        "Respecter strictement toute couleur dominante mentionnee par l'utilisateur, puis choisir une couleur d'accent cohérente avec le secteur et le niveau de gamme.",
      mood_hint:
        "Faire monter une ambiance alignee au brief explicite de l'utilisateur avant toute heuristique sectorielle.",
    };
  }

  if (includesOneOf(source, ["food", "restaurant", "burger", "pizza", "grill", "boisson", "jus", "maquis"])) {
    return {
      palette_hint:
        "Favoriser une couleur dominante chaude et appetissante comme rouge epice, orange braise, jaune safran ou vert frais, avec un accent plus sombre pour structurer.",
      mood_hint:
        "Installer une ambiance genereuse, gourmande, chaude et immediate.",
    };
  }

  if (includesOneOf(source, ["beaute", "coiff", "spa", "maquillage", "parfum", "salon"])) {
    return {
      palette_hint:
        "Favoriser une couleur dominante glamour ou premium comme noir profond, or chaud, cuivre, bordeaux, beige lumineux ou rose soutenu, avec un accent raffine.",
      mood_hint:
        "Installer une ambiance flatteuse, elegante, desirante et haut de gamme accessible.",
    };
  }

  if (includesOneOf(source, ["eglise", "church", "culte", "priere", "gospel", "spirituel"])) {
    return {
      palette_hint:
        "Favoriser une couleur dominante noble et lumineuse comme bleu royal, blanc lumineux, or ou violet profond, avec un accent de lumiere chaude.",
      mood_hint:
        "Installer une ambiance elevee, inspirante, spirituelle et rassembleuse.",
    };
  }

  if (includesOneOf(source, ["event", "concert", "festival", "soir", "show", "anniversaire", "mariage"])) {
    return {
      palette_hint:
        "Favoriser une couleur dominante vibrante et festive comme magenta, orange, rouge scene, bleu electrique ou violet intense, avec des accents lumineux.",
      mood_hint:
        "Installer une ambiance celebratoire, energique et memorisable.",
    };
  }

  return {
    palette_hint:
      "Choisir une couleur dominante forte et une couleur d'accent qui servent la lisibilite commerciale, la chaleur visuelle et la credibilite du secteur.",
    mood_hint:
      "Chercher une ambiance expressive, chaleureuse et orientee conversion plutot qu'une esthetique froide ou neutre.",
  };
}

function inferSectorDetails(input: {
  businessCategory?: string | null;
  product: string;
  idea: string;
}) {
  const source = normalizeKeywordSource(
    input.businessCategory,
    input.product,
    input.idea,
  );

  if (includesOneOf(source, ["food", "restaurant", "burger", "pizza", "grill", "boisson", "jus", "maquis"])) {
    return "Ajouter des details visuels appetissants si pertinents: vapeur, condensation, texture croustillante, brillance saucee, fraicheur visible ou mise en scene culinaire genereuse.";
  }

  if (includesOneOf(source, ["beaute", "coiff", "spa", "maquillage", "parfum", "salon"])) {
    return "Ajouter des details de finition premium si pertinents: cheveux impeccables, peau lumineuse, reflets satinés, pose confiante, materiaux soignes.";
  }

  if (includesOneOf(source, ["eglise", "church", "culte", "priere", "gospel", "spirituel"])) {
    return "Ajouter des details spirituels si pertinents: lumiere diffusee, rayons subtils, scene inspirante, atmosphere elevee sans surcharge mystique kitsch.";
  }

  if (includesOneOf(source, ["event", "concert", "festival", "soir", "show", "anniversaire", "mariage"])) {
    return "Ajouter des details evenementiels si pertinents: fumee legere, spots, foule suggeree, halos lumineux, energie de scene et sensation de rendez-vous majeur.";
  }

  if (includesOneOf(source, ["immobilier", "maison", "villa", "terrain", "appartement", "location", "vente"])) {
    return "Ajouter des details de credibilite immobiliere si pertinents: architecture nette, perspective valorisante, lumiere rassurante, sensation d'espace et de valeur.";
  }

  return "Ajouter seulement les details visuels sectoriels qui renforcent la vente et la credibilite, sans decor inutile.";
}

function buildPromptContext(input: {
  businessName?: string | null;
  businessCategory?: string | null;
  city?: string | null;
  brandTone?: string | null;
  product: string;
  idea: string;
  customPrompt?: string;
  mustDisplayInfo?: string;
  dominantColor?: string;
  refinementAnswers?: Array<{ question: string; answer: string }>;
  format: GenerationFormat;
  referenceImagesCount?: number;
  exampleImagesCount?: number;
}) {
  const sectorProfile = inferSectorProfile(input);
  const commercialIntent = inferCommercialIntent(input);
  const referenceUsage = inferReferenceUsage(input);
  const visualEnergy = inferVisualEnergy(
    input.format,
    input.idea,
    input.customPrompt,
  );
  const paletteAndMood = inferPaletteAndMood(input);
  const sectorDetails = inferSectorDetails(input);

  return {
    business_name: input.businessName ?? null,
    business_category: input.businessCategory ?? null,
    city: input.city ?? null,
    brand_tone: input.brandTone ?? null,
    product_or_service: input.product,
    user_brief: input.idea,
    custom_prompt: input.customPrompt ?? null,
    mandatory_copy_points: input.mustDisplayInfo ?? null,
    user_dominant_color: input.dominantColor ?? null,
    refinement_answers: input.refinementAnswers ?? [],
    output_format: input.format,
    format_guidance: getFormatGuidance(input.format),
    reference_images_count: input.referenceImagesCount ?? 0,
    example_images_count: input.exampleImagesCount ?? 0,
    inferred_sector: sectorProfile.name,
    sector_strategy_hint: sectorProfile.strategy,
    inferred_commercial_intent: commercialIntent.name,
    commercial_intent_hint: commercialIntent.strategy,
    inferred_visual_energy: visualEnergy,
    reference_usage_hint: referenceUsage,
    palette_hint: paletteAndMood.palette_hint,
    mood_hint: paletteAndMood.mood_hint,
    sector_detail_hint: sectorDetails,
  };
}

export async function optimizePrompt(input: {
  businessName?: string | null;
  businessCategory?: string | null;
  city?: string | null;
  brandTone?: string | null;
  product: string;
  idea: string;
  customPrompt?: string;
  mustDisplayInfo?: string;
  dominantColor?: string;
  refinementAnswers?: Array<{ question: string; answer: string }>;
  format: GenerationFormat;
  referenceImagesCount?: number;
  exampleImagesCount?: number;
}) {
  const raw = [
    input.product,
    input.idea,
    input.customPrompt,
    input.mustDisplayInfo,
    input.dominantColor,
    ...(input.refinementAnswers ?? []).map((entry) => `${entry.question} ${entry.answer}`),
  ]
    .filter(Boolean)
    .join(" ");
  const blocked = hasBlockedTerms(raw);

  if (blocked) {
    return {
      safety: "blocked" as const,
      rejection_reason: `Le contenu contient un terme bloque: ${blocked}.`,
      improved_prompt: "",
      short_title: "",
      social_caption: "",
      visual_strategy: "",
      audience_angle: "",
      layout_strategy: "",
      image_direction: "",
    };
  }

  const env = requireOpenRouterEnv();
  const response = await openRouterFetch({
    model: env.OPENROUTER_PROMPT_MODEL,
    temperature: 0.45,
    max_tokens: 1400,
    messages: [
      {
        role: "system",
        content:
          [
            "You are an adaptive commercial creative strategist for AI-generated flyers.",
            "Your job is not to force one flyer style. Infer the best creative direction from the user's commercial goal, sector, tone, audience, format and image references.",
            "Keep the current creation chain intact: user prompt and references are interpreted by you, then passed to the image model. Do not redesign the workflow, only the creative reasoning.",
            "Return JSON only with keys: safety, rejection_reason, improved_prompt, short_title, social_caption, visual_strategy, audience_angle, layout_strategy, image_direction.",
            "safety must be allowed or blocked.",
            "Block illegal, exploitative, hateful, violent, sexual or deceptive ad requests.",
            "When allowed, build a prompt that stays flexible and intelligent: it must adapt to beauty, food, real estate, events, luxury, education, street commerce, services, church communication, recruitment, maquis culture, or any other category without collapsing into one generic flyer recipe.",
            "Use the references as guidance, not as a rigid style prison. Respect useful cues from user images such as color, product shape, person identity, texture, packaging, brand universe, or realism level.",
            "Treat the inferred hints as helpers, not rigid instructions. If the user brief clearly points elsewhere, follow the brief.",
            "The improved_prompt must optimize for strong commercial readability, useful hierarchy, believable imagery, strategic composition, and the right emotional tone for the business.",
            "The improved_prompt must follow this exact order in natural sentences, not dry keywords.",
            "Section 1 must always begin with: professional flyer design by an expert African graphic designer, high-end commercial print quality, award-winning design, magazine-grade visual quality, meticulous attention to detail, polished and refined, production-ready artwork.",
            "Section 2 must always include: vibrant West/Central African aesthetic, bold and energetic color palette, cultural visual richness, warm and inviting tropical tones, African market visual language, high-contrast eye-catching design, celebratory and dynamic composition.",
            "Section 3 must adapt the subject, dominant color, accent color, mood, sector context and specific visual details from the user brief.",
            "Section 4 must always include: dramatic studio lighting with golden highlights, cinematic lighting setup, strong light-shadow contrast, professional product photography lighting, soft background bokeh, depth and dimension, rim lighting to separate subject from background.",
            "Section 5 must always include: clear text overlay areas at top and bottom thirds, clean negative space reserved for typography, uncluttered zones for headline and contact information, visual hierarchy with defined focal points, poster layout with balanced composition.",
            "Section 6 must always include: ultra detailed, 4K resolution, sharp focus throughout, perfect composition, rule of thirds, balanced layout, no distortion, no deformation, no artifacts, photorealistic render, crystal clear details.",
             "Section 7 must always include a poster intent adapted to the requested format: poster design style, commercial billboard aesthetic, print-ready artwork, clean edges, social media ready format, plus portrait orientation only when the requested format is vertical.",
             "If the user gives a dominant color, respect it absolutely.",
            "If mandatory_copy_points is provided, every critical item from that field must be visibly represented in the generated design intent and text hierarchy. Do not omit those items.",
            "Never invent factual information not present in user_brief, mandatory_copy_points, refinement_answers, or explicit user inputs.",
            "Do not add phone numbers, addresses, websites, social handles, prices, dates, opening hours, promo percentages, names, or legal mentions unless explicitly provided by the user.",
            "When mandatory_copy_points is present, use exactly those essential facts as source of truth for visible flyer copy. You may only normalize spelling/accents/typography without changing factual content.",
             "If refinement_answers are provided, treat them as final directives from the client and follow them strictly over default heuristics.",
             "If the user uploads a reference image for a product, person or logo, mention that element explicitly as a hero element in the foreground with photorealistic integration.",
            "Never use the words simple or minimalist inside the improved_prompt, and do not use clean outside the two fixed technical phrases that already contain it.",
            "Do not exceed roughly 400 tokens in the improved_prompt.",
            "Adapt the density, rhythm and polish level to the actual brief: some flyers need urgency and energy, others need calm trust, premium restraint or product appetite.",
            "Do not overfit to one region, one palette or one composition recipe. Stay culturally credible, commercially useful and visually intentional.",
            "Avoid generic AI aesthetics, fake luxury when the brief is practical, and overdesigned layouts when the goal is quick conversion.",
            "Default language is French for all flyer text content.",
            "If the user brief is in another language, keep all flyer text in that same language.",
            "If the user explicitly provides some English copy (for brand taglines, slogans, or mandatory words), keep those exact English fragments as-is.",
            "Do not blindly copy spelling mistakes from user input. Correct spelling, accents, grammar, and typography for all visible flyer text while preserving meaning and commercial intent.",
            "For mandatory_copy_points, preserve factual values exactly (names, phone numbers, dates, prices, percentages, addresses) but correct spelling around them when needed.",
            "Before finalizing improved_prompt, run an explicit copy-quality check: spelling, grammar agreement, punctuation, capitalization, accent marks, and readability of headline/CTA/contact lines.",
            "Reject malformed or unclear copy formulations and rewrite them into correct, professional French (or the user's language) while preserving factual values exactly.",
            "All copy shown on the flyer must be internally consistent in one main language unless the user explicitly requests bilingual text.",
          ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify(buildPromptContext(input)),
      },
    ],
  });

  const content = response?.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    throw new Error("Prompt optimizer returned an invalid payload.");
  }

  return parseJsonBlock<PromptOptimizationResult>(content);
}

export async function generateRefinementQuestions(input: {
  businessName?: string | null;
  businessCategory?: string | null;
  city?: string | null;
  brandTone?: string | null;
  product: string;
  idea: string;
  customPrompt?: string;
  mustDisplayInfo?: string;
  dominantColor?: string;
  format: GenerationFormat;
}) {
  const env = requireOpenRouterEnv();
  const response = await openRouterFetch({
    model: env.OPENROUTER_REFINEMENT_MODEL,
    temperature: 0.2,
    max_tokens: 700,
    messages: [
      {
        role: "system",
        content:
          [
            "You are a French-speaking creative brief clarifier for flyer generation.",
            "Your goal is to ask up to 10 high-impact refinement questions only when needed.",
            "Return JSON only with one key: questions.",
            "questions is an array of objects with keys: id, prompt, type, placeholder, options.",
            "type must be text or single_choice.",
            "For text: options must be empty array, placeholder must contain concrete examples.",
            "For single_choice: provide 3 to 6 options and keep them mutually exclusive when possible.",
            "Keep each prompt short, clear, and directly actionable.",
            "Ask nothing if the brief is already precise enough; in that case return an empty questions array.",
            "Prioritize missing factual fields that prevent a safe final copy: phone, address, website, social handle, date, time, place, exact offer, price, CTA, and legal details when relevant.",
            "Focus on uncertainties that strongly affect final composition, style, structure, mood, or target conversion.",
            "Keep output in French.",
          ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({
          business_name: input.businessName ?? null,
          business_category: input.businessCategory ?? null,
          city: input.city ?? null,
          brand_tone: input.brandTone ?? null,
          product_or_service: input.product,
          user_brief: input.idea,
          custom_prompt: input.customPrompt ?? null,
          mandatory_copy_points: input.mustDisplayInfo ?? null,
          user_dominant_color: input.dominantColor ?? null,
          output_format: input.format,
        }),
      },
    ],
  });

  const content = response?.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    throw new Error("Refinement model returned an invalid payload.");
  }

  const raw = parseJsonBlock<unknown>(content);
  return sanitizeRefinementQuestions(raw);
}

export async function generateImage(input: {
  finalPrompt: string;
  format: GenerationFormat;
  referenceImages?: string[];
}) {
  const env = requireOpenRouterEnv();
  const content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [{ type: "text", text: input.finalPrompt }];

  for (const image of input.referenceImages ?? []) {
    content.push({ type: "image_url", image_url: { url: image } });
  }

  async function requestImage(payload: Record<string, unknown>) {
    const response = await openRouterFetch(payload);

    const imageDataUrl =
      response?.choices?.[0]?.message?.images?.[0]?.image_url?.url ??
      response?.choices?.[0]?.message?.images?.[0]?.imageUrl?.url ??
      response?.choices?.[0]?.message?.image_url?.url ??
      response?.choices?.[0]?.message?.imageUrl?.url ??
      response?.data?.[0]?.url ??
      (typeof response?.data?.[0]?.b64_json === "string"
        ? `data:image/png;base64,${response.data[0].b64_json}`
        : undefined);

    let contentImageDataUrl: string | undefined;
    const contentParts = response?.choices?.[0]?.message?.content;
    if (Array.isArray(contentParts)) {
      for (const part of contentParts) {
        if (
          part &&
          typeof part === "object" &&
          "type" in part &&
          (part as { type?: unknown }).type === "image_url"
        ) {
          const url = (part as { image_url?: { url?: unknown } }).image_url?.url;
          if (typeof url === "string" && url) {
            contentImageDataUrl = url;
            break;
          }
        }
      }
    }
    if (!contentImageDataUrl && typeof contentParts === "string") {
      const markdownMatch = contentParts.match(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/i);
      const directUrlMatch = contentParts.match(/https?:\/\/[^\s"]+\.(?:png|jpg|jpeg|webp)(?:\?[^\s"]*)?/i);
      const dataUrlMatch = contentParts.match(/data:image\/(?:png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+/i);
      const jsonUrlMatch = contentParts.match(/"url"\s*:\s*"(https?:\/\/[^"]+)"/i);
      contentImageDataUrl =
        dataUrlMatch?.[0] ??
        markdownMatch?.[1] ??
        directUrlMatch?.[0] ??
        jsonUrlMatch?.[1];
    }
    const finalImageDataUrl = imageDataUrl ?? contentImageDataUrl ?? findImageCandidate(response);
    return { imageDataUrl: finalImageDataUrl, response };
  }

  const basePayload = {
    model: env.OPENROUTER_IMAGE_MODEL,
    modalities: ["image", "text"],
    max_tokens: 400,
    stream: false,
    messages: [{ role: "user", content } satisfies OpenRouterMessage],
    image_config: {
      aspect_ratio: getAspectRatio(input.format),
      image_size: "1K",
    },
  };

  let finalImageDataUrl: unknown;
  let response: Record<string, unknown> | undefined;
  try {
    const firstTry = await requestImage(basePayload);
    finalImageDataUrl = firstTry.imageDataUrl;
    response = firstTry.response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (
      message.includes("OPENROUTER_ERROR:404:") &&
      message.includes("output modalities: image, text")
    ) {
      const imageOnlyPayload = {
        ...basePayload,
        modalities: ["image"],
      };
      const retryImageOnly = await requestImage(imageOnlyPayload);
      finalImageDataUrl = retryImageOnly.imageDataUrl;
      response = retryImageOnly.response;
    } else {
      throw error;
    }
  }

  if (typeof finalImageDataUrl !== "string") {
    const fallbackPayload = {
      model: env.OPENROUTER_IMAGE_MODEL,
      modalities: ["image", "text"],
      max_tokens: 500,
      stream: false,
      messages: [{ role: "user", content: input.finalPrompt }],
      image_config: {
        aspect_ratio: getAspectRatio(input.format),
      },
    };
    const retry = await requestImage(fallbackPayload);
    finalImageDataUrl = retry.imageDataUrl;
    response = retry.response;
  }

  if (typeof finalImageDataUrl !== "string") {
    const toolPrompt = [
      "Use the openrouter:image_generation tool immediately.",
      "Generate exactly one image from the following prompt.",
      "Do not answer with analysis or reasoning.",
      "Return the tool result with the image URL.",
      "",
      input.finalPrompt,
    ].join("\n");

    const toolPayload = {
      model: env.OPENROUTER_PROMPT_MODEL,
      max_tokens: 300,
      stream: false,
      messages: [{ role: "user", content: toolPrompt }],
      tools: [
        {
          type: "openrouter:image_generation",
          parameters: {
            model: env.OPENROUTER_IMAGE_MODEL,
            aspect_ratio: getAspectRatio(input.format),
            output_format: "png",
          },
        },
      ],
    };
    const toolRetry = await requestImage(toolPayload);
    finalImageDataUrl = toolRetry.imageDataUrl;
    response = toolRetry.response;
  }

  if (typeof finalImageDataUrl !== "string") {
    const messageText = response?.choices?.[0]?.message?.content;
    const normalizedMessage =
      typeof messageText === "string" ? messageText.toLowerCase() : "";
    const looksTooLong =
      normalizedMessage.includes("too long") ||
      normalizedMessage.includes("shorten") ||
      normalizedMessage.includes("simplify");

    if (looksTooLong) {
      const reducedPrompt = condenseImagePrompt(input.finalPrompt);
      const reducedPayload = {
        model: env.OPENROUTER_IMAGE_MODEL,
        modalities: ["image", "text"],
        max_tokens: 350,
        stream: false,
        messages: [{ role: "user", content: reducedPrompt }],
        image_config: {
          aspect_ratio: getAspectRatio(input.format),
          image_size: "1K",
        },
      };
      const reducedRetry = await requestImage(reducedPayload);
      finalImageDataUrl = reducedRetry.imageDataUrl;
      response = reducedRetry.response;
    }
  }

  if (typeof finalImageDataUrl !== "string") {
    const preview = JSON.stringify(response?.choices?.[0]?.message ?? {}).slice(0, 700);
    throw new Error(
      `No generated image returned by OpenRouter. Response keys: ${Object.keys(response ?? {}).join(", ")}. message preview: ${preview}`,
    );
  }

  return {
    imageDataUrl: finalImageDataUrl,
    raw: response,
  };
}

export async function applyWatermark(
  imageDataUrl: string,
  label = "ASMODRA STARTER",
) {
  const [, base64] = imageDataUrl.split(",");

  if (!base64) {
    throw new Error("Invalid image data URL.");
  }

  const buffer = Buffer.from(base64, "base64");
  const image = sharp(buffer);
  const metadata = await image.metadata();
  const width = metadata.width ?? 1024;
  const height = metadata.height ?? 1024;
  const fontSize = Math.max(28, Math.round(width * 0.035));

  const overlay = Buffer.from(`
    <svg width="${width}" height="${height}">
      <rect x="0" y="${height - 120}" width="${width}" height="120" fill="rgba(20,20,20,0.32)" />
      <text
        x="50%"
        y="${height - 48}"
        text-anchor="middle"
        fill="rgba(255,255,255,0.92)"
        font-size="${fontSize}"
        font-family="Arial, sans-serif"
        letter-spacing="4"
      >${label}</text>
    </svg>
  `);

  const output = await image.composite([{ input: overlay, gravity: "south" }]).png().toBuffer();
  return `data:image/png;base64,${output.toString("base64")}`;
}
