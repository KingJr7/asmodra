import type { GenerationFormat } from "@/lib/types";

const XAF_PER_USD = 620;

// Prices fetched from OpenRouter models endpoint (2026-04-27):
// - openai/gpt-4.1-mini: prompt 0.0000004, completion 0.0000016 (USD/token)
// - openai/gpt-5-image-mini: prompt 0.0000025, completion 0.000002 (USD/token)
const PROMPT_MODEL_USD_PER_TOKEN = {
  prompt: 0.0000004,
  completion: 0.0000016,
};

const IMAGE_MODEL_USD_PER_TOKEN = {
  prompt: 0.0000025,
  completion: 0.000002,
};

const ESTIMATED_TOKENS = {
  promptModelPrompt: 1800,
  promptModelCompletion: 700,
  imageModelPrompt: 1200,
  imageModelCompletion: 350,
  perUploadedImagePromptOverhead: 220,
};

export function computeCreditsCost(input: {
  format: GenerationFormat;
  referencesCount: number;
  examplesCount: number;
  totalUploadBytes: number;
  hasCustomPrompt: boolean;
}) {
  const formatBase = input.format === "story" ? 10 : input.format === "print" ? 12 : 8;
  const referenceCost = input.referencesCount * 3;
  const exampleCost = input.examplesCount * 2;
  const uploadWeightCost = Math.ceil(input.totalUploadBytes / (4 * 1024 * 1024));
  const briefComplexityCost = input.hasCustomPrompt ? 1 : 0;

  return {
    formatBase,
    referenceCost,
    exampleCost,
    uploadWeightCost,
    briefComplexityCost,
    total:
      formatBase +
      referenceCost +
      exampleCost +
      uploadWeightCost +
      briefComplexityCost,
  };
}

export function estimateGenerationCostUsd(input: {
  referencesCount: number;
  examplesCount: number;
}) {
  const uploadedImages = input.referencesCount + input.examplesCount;
  const extraPromptTokens = uploadedImages * ESTIMATED_TOKENS.perUploadedImagePromptOverhead;

  const promptModelCost =
    ESTIMATED_TOKENS.promptModelPrompt * PROMPT_MODEL_USD_PER_TOKEN.prompt +
    ESTIMATED_TOKENS.promptModelCompletion * PROMPT_MODEL_USD_PER_TOKEN.completion;
  const imageModelCost =
    (ESTIMATED_TOKENS.imageModelPrompt + extraPromptTokens) * IMAGE_MODEL_USD_PER_TOKEN.prompt +
    ESTIMATED_TOKENS.imageModelCompletion * IMAGE_MODEL_USD_PER_TOKEN.completion;

  return promptModelCost + imageModelCost;
}

export function getCreditEconomics() {
  const baselineUsd = estimateGenerationCostUsd({ referencesCount: 0, examplesCount: 0 });
  const referencedUsd = estimateGenerationCostUsd({ referencesCount: 2, examplesCount: 1 });

  return {
    sourceDate: "2026-04-27",
    promptModel: "openai/gpt-4.1-mini",
    imageModel: "openai/gpt-5-image-mini",
    xafPerUsd: XAF_PER_USD,
    baselineUsd,
    baselineXaf: baselineUsd * XAF_PER_USD,
    referencedUsd,
    referencedXaf: referencedUsd * XAF_PER_USD,
    targetMarginMultiplier: 90,
  };
}
