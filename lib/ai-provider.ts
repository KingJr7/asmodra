import { z } from "zod";

const aiProviderSchema = z.enum(["openrouter", "puter", "pollinations"]);

export type AiProvider = z.infer<typeof aiProviderSchema>;

export function getAiProvider(): AiProvider {
  const parsed = aiProviderSchema.safeParse(process.env.AI_PROVIDER ?? "openrouter");
  if (!parsed.success) {
    throw new Error("AI_PROVIDER must be one of: 'openrouter', 'puter', 'pollinations'.");
  }

  return parsed.data;
}
