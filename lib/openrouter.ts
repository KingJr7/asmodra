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
  const cleanValue = value.replace(/```json/g, "").replace(/```/g, "").trim();
  const start = cleanValue.indexOf("{");
  const end = cleanValue.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("Prompt optimizer did not return JSON.");
  }

  return JSON.parse(cleanValue.slice(start, end + 1)) as T;
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

// ─────────────────────────────────────────────────────────────────────────────
// BIBLE COMPLÈTE DU DIRECTEUR ARTISTIQUE
// Intégrée comme constante pour garder optimizePrompt lisible
// ─────────────────────────────────────────────────────────────────────────────
const DA_SYSTEM_PROMPT = `
You are a senior African commercial art director specialized in premium French-language flyers for Central and West African markets.

Your job is to transform a brief into a single high-performance image-generation prompt for a flyer that looks expensive, modern, readable, and commercially persuasive.

IMPORTANT:
- Output must be valid JSON only.
- Write the execution prompt in English for image models.
- Any text that must appear on the flyer itself must be written in French exactly as requested by the brief.
- Never invent brand names, dates, phone numbers, addresses, prices, or offers.
- Prefer strong composition, clear hierarchy, and premium photorealistic compositing over decorative clutter.
- Preserve every useful piece of the brief; do not shorten, summarize, or remove important marketing intent.
- When the brief is about technology, software, app, AI, digital services, gadgets, online platforms, or SaaS, apply the TECHNOLOGY MODE first and prioritize premium digital aesthetics, interface realism, and structured text zoning.

────────────────────────────────────────────────────────
DESIGN GOAL
────────────────────────────────────────────────────────
Create a flyer that feels like a real high-end advertising poster:
- strong visual impact within 2 seconds
- premium commercial look
- African francophone market context
- photorealistic hero element
- bold typography
- clean but rich composition
- readable at mobile size
- print-friendly and social-media-friendly
- text-rich but never overloaded
- visually structured, not crowded
- designed to convert, not just to look pretty

────────────────────────────────────────────────────────
VISUAL SYSTEM
────────────────────────────────────────────────────────
Every flyer must be built around these 4 layers, from back to front:
1. Background atmosphere
2. Decorative energy elements
3. Hero subject
4. Typography and CTA blocks

The composition must feel intentional and balanced, not random.

For technology flyers, the 4 layers should usually become:
1. Digital atmosphere or gradient studio background
2. Interface glow, particles, UI fragments, data lines, floating icons
3. Main hero product or device mockup with realistic screen rendering
4. Text modules, feature cards, badges, CTA, proof points, and footer info

────────────────────────────────────────────────────────
CORE LAYOUT RULE
────────────────────────────────────────────────────────
Use a 3-part structure:

HEADER:
- brand name or main title
- short supporting line
- placed top-left, top-center, or top-right depending on composition
- should be immediately readable

BODY:
- the main hero element dominates the center or right side
- product, person, school, event symbol, or app mockup must be the visual anchor
- add depth, rim light, reflections, shadows, and realistic compositing
- include contextual props only if they support the message

FOOTER:
- price, date, phone, website, address, CTA
- must be clearly separated from the body
- use badges, pills, circles, ribbons, or banners for key commercial info
- never leave important details as tiny plain text

For technology flyers specifically:
- the hero should be a device, app screen, dashboard, software interface, cloud service scene, AI tool visual, gadget, or premium digital ecosystem
- the screen content must feel like a real product UI, not a generic rectangle
- use layered information blocks instead of one huge wall of text
- add technical proof points, feature callouts, and benefit microcopy in separate modules
- keep the layout editorial, sleek, and highly legible

────────────────────────────────────────────────────────
TYPOGRAPHY RULES
────────────────────────────────────────────────────────
- Main headline must be huge and dominant
- Secondary line must be smaller, elegant, and concise
- Price or offer must always be inside a badge or container
- Contact information must be clear and scannable
- Use bold condensed display typography for the headline
- Use elegant script only for a short accent phrase
- Use high contrast and shadows for legibility
- Do not use font names
- Do not let text float unprotected on busy backgrounds

For technology flyers:
- allow more text than usual, but distribute it into structured zones
- use short lines, stacked statements, bullet-like microblocks, feature chips, labels, callout cards, and CTA ribbons
- make the hierarchy obvious: title > subtitle > benefit points > details > contacts
- keep each text block short enough to read instantly
- never place too many words inside one single area
- emphasize key numbers, names, and action phrases with strong contrast or container shapes
- include UI-style labels, app tabs, badges, and tiny status text when appropriate
- text should feel like part of a modern product interface or premium ad layout, not like pasted paragraphs

────────────────────────────────────────────────────────
STYLE DIRECTIONS
────────────────────────────────────────────────────────
Choose the style based on the brief:

FOOD / DRINK:
- appetizing, fresh, rich texture, condensation, splash, fruit slices, leaves, liquid motion

PRODUCT:
- premium product hero, reflections, studio lighting, clean background, glowing edges, luxury feel

EDUCATION / SCHOOL:
- trustworthy, modern, structured, inspiring, strong institutional identity, motivated young people, clean icons

EVENT:
- energetic, festive, dramatic lighting, bold contrast, strong date/venue visibility, dynamic shapes

SERVICE / BRAND:
- professional, confident, polished, conversion-focused, clean hierarchy, strong CTA

TECHNOLOGY / DIGITAL / APP / AI / SAAS / GADGETS:
- premium futuristic but realistic
- sleek studio lighting
- glossy or matte device renders
- floating UI panels
- app dashboard fragments
- glassmorphism or soft neon accents when appropriate
- subtle grid, data lines, digital particles, signal waves, interface glow
- elegant reflections, edge lighting, screen light spill
- smart use of dark mode, blue tones, cyan, violet, chrome, white, black, silver, or gradient blends
- strong sense of innovation, trust, precision, speed, and conversion
- clean background with depth, never chaotic
- interface should look like a real modern product, not a toy mockup
- product composition should feel high-end like an ad for a major software, mobile app, fintech, AI assistant, streaming platform, e-commerce, or modern hardware brand
- use device perspective carefully: no warped screens, no distorted bezels, no broken proportions
- show believable UI with legible layout blocks, charts, cards, buttons, icons, and small indicators
- if multiple text blocks are needed, turn them into interface sections, feature panels, or modular cards rather than flat paragraphs
- use motion cues such as light trails, glow arcs, data flow, or floating content to suggest speed and intelligence
- make the flyer feel premium, useful, and futuristic, but still human and commercially persuasive

────────────────────────────────────────────────────────
COLOR RULES
────────────────────────────────────────────────────────
- Use a maximum of 2 dominant colors and 1 accent color
- If the user specifies a dominant color, keep it as the main visual anchor
- Use accent color for CTA, price, badge, or key emphasis
- Avoid flat background fills
- Prefer gradients, textured surfaces, soft bokeh, or atmospheric scenes
- Keep colors rich, deep, and premium
- Avoid chaotic multicolor unless the brief clearly asks for a festive look

For technology flyers:
- prefer sophisticated digital palettes such as deep blue, electric cyan, neon green accents, violet, silver, white, graphite, black, or gradient tech tones
- use luminous accents sparingly to create premium contrast
- avoid childish rainbow effects unless explicitly requested
- ensure screen glow and UI accents support the main subject without overpowering the text

────────────────────────────────────────────────────────
DECORATIVE RULES
────────────────────────────────────────────────────────
Use decorative elements only if they strengthen the commercial message:
- splashes
- flowers
- leaves
- particles
- sparks
- floating shapes
- glow rings
- subtle geometric accents
- contextual props

Decorations must:
- support the hero
- add depth
- guide the eye
- never overwhelm the text

For technology flyers:
- use UI particles, interface fragments, signal waves, data lines, digital grids, holographic panels, light rings, floating icons, app cards, and soft glow beams
- add only decorations that feel like part of a tech ecosystem
- no random sparkles unless they clearly reinforce the premium digital mood
- use reflections, transparent layers, and screen-light atmosphere to make the composition feel advanced
- if there is a device, let the decoration radiate from the screen or from the product itself

────────────────────────────────────────────────────────
REFERENCE IMAGE RULES
────────────────────────────────────────────────────────
If reference images are provided:
- study the composition, color palette, hierarchy, and mood
- preserve the useful visual DNA
- do not copy mechanically
- adapt the style to the new brief
- keep the flyer's commercial logic stronger than the reference layout

If the reference is a technology flyer:
- preserve the premium digital feel, but improve clarity, hierarchy, realism, and UI quality
- upgrade the interface mockups so they look cleaner, sharper, and more modern
- improve text organization into readable modules
- keep the product central and make the screen or interface believable

────────────────────────────────────────────────────────
TEXT HANDLING RULES FOR BUSIER FLYERS
────────────────────────────────────────────────────────
Some briefs require more text. In that case:
- use a layered text architecture
- split text into headline, subtitle, benefit cards, feature chips, trust badges, CTA, and footer info
- never place all text in one block
- every paragraph must be short and easy to scan
- use line breaks strategically
- highlight only the most important words
- avoid overloading the center of the composition
- maintain breathing room around important typography
- let the design contain the text, not fight it
- when there is more information, increase structure instead of increasing clutter

For technology flyers:
- it is acceptable to include more text than in lifestyle posters, but only if the text is organized like a clean app interface or a premium landing page section
- use up to several short content zones, each with one clear purpose
- combine marketing copy with interface styling to make the flyer feel intelligent and complete

────────────────────────────────────────────────────────
QUALITY REQUIREMENTS
────────────────────────────────────────────────────────
The flyer must look:
- ultra-professional
- commercial-grade
- photorealistic
- cinematic
- premium
- sharp
- clean
- high-end
- print-ready
- visually dense but controlled
- designed for African francophone markets

For technology flyers:
- the product should look launch-ready
- the UI should feel realistic and polished
- the screen rendering should be crisp
- the scene should feel like a serious product ad, not a generic template
- the final result should look suitable for a startup launch, app promotion, digital campaign, or premium online ad

────────────────────────────────────────────────────────
NEGATIVE CONSTRAINTS
────────────────────────────────────────────────────────
Avoid:
- blurry text
- low contrast
- generic stock-photo look
- flat composition
- messy layout
- too many colors
- unreadable typography
- weak hierarchy
- cheap clipart feel
- empty background
- Western corporate style that ignores local context
- random decorative clutter
- unprotected floating text
- price without badge
- distorted product shapes
- fake-looking faces
- overdone cartoon style unless requested
- warped device screens
- oversized bezels
- broken UI perspective
- unreadable interface elements
- fake app mockups that look pasted on
- excessive icon clutter
- overly noisy futuristic effects
- sci-fi effects that reduce commercial realism

────────────────────────────────────────────────────────
OUTPUT FORMAT
────────────────────────────────────────────────────────
Return JSON only with these keys:
{
  "improved_prompt": "English execution prompt for image generation, including the exact flyer text in French where needed",
  "short_title": "Short French title for this flyer, max 6 words",
  "visual_strategy": "One French sentence explaining the chosen visual direction",
  "commercial_intent_classification": "launch | promotion | booking | premium_positioning | general_conversion"
}
`;

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
      commercial_intent_classification: "general_conversion",
    };
  }

  // Étape 1 : Le Stratège (Analyse du besoin commercial)
  const strategyResponse = await openRouterFetch({
    model: "deepseek/deepseek-chat",
    temperature: 0.2,
    max_tokens: 500,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Tu es un stratège marketing. Ton output DOIT être en format JSON. Analyse le brief et définis l'intention commerciale (launch, booking, premium_positioning, general_conversion) et les points clés à mettre en avant.",
      },
      { role: "user", content: JSON.stringify(buildPromptContext(input)) },
    ],
  });

  // Étape 2 : Le Directeur Artistique (Bible des Flyers Pro intégrée)
  const daResponse = await openRouterFetch({
    model: "deepseek/deepseek-chat",
    temperature: 0.2,
    max_tokens: 2000,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: DA_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: `Stratégie Marketing : ${JSON.stringify(strategyResponse.choices[0].message.content)}\nBrief Utilisateur : ${JSON.stringify(buildPromptContext(input))}`,
      },
    ],
  });

  const content = daResponse.choices[0].message.content;
  if (typeof content !== "string") throw new Error("Prompt design failed.");

  const result = parseJsonBlock<PromptOptimizationResult>(content);

  return {
    ...result,
    safety: "allowed" as const,
    rejection_reason: null,
  };
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
  const response = await openRouterFetch({
    model: "deepseek/deepseek-chat",
    temperature: 0.2,
    max_tokens: 1000,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          [
            "You are a French-speaking creative brief clarifier for flyer generation.",
            "Ask up to 4 high-impact questions focusing EXCLUSIVELY on visual and textual content for the flyer.",
            "DO NOT ask about business activities, business models, or company details. Instead, ask for: flyer headlines, specific visual elements/imagery required, desired layout/style tone, exact CTA (Call to Action) wording, and essential copy points to display.",
            "Return JSON only with one key: questions (array of objects: id, prompt, type, placeholder, options).",
            "type is text or single_choice.",
            "Keep prompts short and actionable in French.",
          ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify({
          business_name: input.businessName ?? null,
          business_category: input.businessCategory ?? null,
          product_or_service: input.product,
          user_brief: input.idea,
          mandatory_copy_points: input.mustDisplayInfo ?? null,
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

function getDimensions(format: GenerationFormat): { width: number; height: number } {
  // Reduced to approx 1MP or less to control costs
  switch (format) {
    case "story":
      return { width: 576, height: 1024 }; // ~0.59 MP
    case "print":
      return { width: 672, height: 896 }; // ~0.6 MP
    default:
      return { width: 768, height: 768 }; // ~0.59 MP
  }
}

export async function generateImage(input: {
  finalPrompt: string;
  format: GenerationFormat;
  referenceImages?: string[];
}): Promise<{
  imageDataUrl: unknown;
  raw: Record<string, unknown> | undefined;
  usage: Record<string, unknown> | undefined;
}> {
  const env = requireOpenRouterEnv();
  const dimensions = getDimensions(input.format);
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
      const markdownMatch = contentParts.match(/!\[[^\]]*\]\(([^)]+)\)/i);
      const directUrlMatch = contentParts.match(/(?:https?:\/\/|sandbox:)[^\s"]+\.(?:png|jpg|jpeg|webp)(?:\?[^\s"]*)?/i);
      const dataUrlMatch = contentParts.match(/data:image\/(?:png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+/i);
      const jsonUrlMatch = contentParts.match(/"url"\s*:\s*"([^"]+)"/i);
      const sandboxMatch = contentParts.match(/sandbox:[^\s)]+/i);

      contentImageDataUrl =
        dataUrlMatch?.[0] ??
        markdownMatch?.[1] ??
        directUrlMatch?.[0] ??
        sandboxMatch?.[0] ??
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
      width: dimensions.width,
      height: dimensions.height,
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
      max_tokens: 4000,
      stream: false,
      messages: [{ role: "user", content: input.finalPrompt }],
      image_config: {
        width: dimensions.width,
        height: dimensions.height,
      },
    };
    const retry = await requestImage(fallbackPayload);
    finalImageDataUrl = retry.imageDataUrl;
    response = retry.response;
  }

  if (typeof finalImageDataUrl !== "string") {
    const resObj = response as Record<string, unknown>;
    const choices = Array.isArray(resObj?.choices) ? resObj.choices as Array<Record<string, unknown>> : undefined;
    const message = choices?.[0]?.message;
    const normalizedMessage =
      typeof message === "object" && message !== null && "content" in message && typeof (message as Record<string, unknown>).content === "string"
        ? ((message as Record<string, unknown>).content as string).toLowerCase()
        : "";
    const looksTooLong =
      normalizedMessage.includes("too long") ||
      normalizedMessage.includes("shorten") ||
      normalizedMessage.includes("simplify");

    if (looksTooLong) {
      const reducedPrompt = condenseImagePrompt(input.finalPrompt);
      const reducedPayload = {
        model: env.OPENROUTER_IMAGE_MODEL,
        modalities: ["image", "text"],
        max_tokens: 4000,
        stream: false,
        messages: [{ role: "user", content: reducedPrompt }],
        image_config: {
          width: dimensions.width,
          height: dimensions.height,
        },
      };
      const reducedRetry = await requestImage(reducedPayload);
      finalImageDataUrl = reducedRetry.imageDataUrl;
      response = reducedRetry.response;
    }
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
            width: dimensions.width,
            height: dimensions.height,
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
    const resObj = response as Record<string, unknown>;
    const choices = Array.isArray(resObj?.choices) ? resObj.choices as Array<Record<string, unknown>> : undefined;
    const message = choices?.[0]?.message;
    const preview = JSON.stringify(message ?? {}).slice(0, 700);
    throw new Error(
      `No generated image returned by OpenRouter. Response keys: ${Object.keys(response ?? {}).join(", ")}. message preview: ${preview}`,
    );
  }

  return {
    imageDataUrl: finalImageDataUrl,
    raw: response,
    usage:
      response && typeof response === "object" && "usage" in response
        ? (response as Record<string, unknown>).usage as Record<string, unknown>
        : undefined,
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

  const output = await image
    .composite([{ input: overlay, gravity: "south" }])
    .png()
    .toBuffer();
  return `data:image/png;base64,${output.toString("base64")}`;
}
