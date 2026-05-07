export type PlanId = "starter" | "pro" | "business";
export type CreditPackId =
  | "credits_pack_oneshot"
  | "credits_topup"
  | "credits_pack_small"
  | "credits_pack_medium"
  | "credits_pack_large";
export type StoreItemId = PlanId | CreditPackId;

export type PlanDefinition = {
  id: PlanId;
  name: string;
  monthlyPriceXaf: number;
  monthlyQuota: number;
  watermark: boolean;
  description: string;
  perks: string[];
};

export type CreditPackDefinition = {
  id: CreditPackId;
  name: string;
  priceXaf: number;
  credits: number;
  description: string;
};

export const PLAN_DEFINITIONS: Record<PlanId, PlanDefinition> = {
  starter: {
    id: "starter",
    name: "Starter",
    monthlyPriceXaf: 0,
    monthlyQuota: 8,
    watermark: true,
    description: "Ideal pour tester la puissance d'Asmodra sans frais.",
    perks: [
      "8 crédits (~1 génération)",
      "Signature Asmodra obligatoire",
      "Accès au Studio standard",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyPriceXaf: 15000,
    monthlyQuota: 250,
    watermark: false,
    description: "Pour les indépendants et créateurs sérieux.",
    perks: [
      "~31 générations",
      "Sans signature Asmodra",
      "Moteur DA Ultra Pro",
      "Support prioritaire",
    ],
  },
  business: {
    id: "business",
    name: "Business",
    monthlyPriceXaf: 25000,
    monthlyQuota: 480,
    watermark: false,
    description: "Pour les agences et commerces à fort volume.",
    perks: [
      "~60 générations",
      "Sans signature Asmodra",
      "Toutes les fonctionnalités Pro",
      "Générations haute priorité",
      "Account Manager dédié",
    ],
  },
};

export const PLAN_LIST = Object.values(PLAN_DEFINITIONS);

export const CREDIT_PACK_DEFINITIONS: Record<CreditPackId, CreditPackDefinition> = {
  credits_pack_oneshot: {
    id: "credits_pack_oneshot",
    name: "One-shot",
    priceXaf: 500,
    credits: 8,
    description: "1 génération rapide pour un besoin ponctuel.",
  },
  credits_topup: {
    id: "credits_topup",
    name: "Micro Recharge",
    priceXaf: 2000,
    credits: 40,
    description: "~5 générations pour finir un projet urgent.",
  },
  credits_pack_small: {
    id: "credits_pack_small",
    name: "Pack Créateur",
    priceXaf: 5000,
    credits: 120,
    description: "~15 générations. Le complément idéal pour vos campagnes.",
  },
  credits_pack_medium: {
    id: "credits_pack_medium",
    name: "Pack Business",
    priceXaf: 10000,
    credits: 250,
    description: "~31 générations. Pour un usage hebdomadaire intensif.",
  },
  credits_pack_large: {
    id: "credits_pack_large",
    name: "Pack Volume",
    priceXaf: 20000,
    credits: 550,
    description: "~68 générations. La meilleure valeur pour les gros besoins.",
  },
};

export const CREDIT_PACK_LIST = Object.values(CREDIT_PACK_DEFINITIONS);

export type StoreItemDefinition =
  | (PlanDefinition & { kind: "plan"; amountXaf: number; credits: number })
  | (CreditPackDefinition & { kind: "credit_pack"; amountXaf: number });

export function getStoreItemDefinition(itemId: string): StoreItemDefinition | null {
  const plan = PLAN_DEFINITIONS[itemId as PlanId];

  if (plan) {
    return {
      ...plan,
      kind: "plan",
      amountXaf: plan.monthlyPriceXaf,
      credits: plan.monthlyQuota,
    };
  }

  const pack = CREDIT_PACK_DEFINITIONS[itemId as CreditPackId];

  if (pack) {
    return {
      ...pack,
      kind: "credit_pack",
      amountXaf: pack.priceXaf,
    };
  }

  return null;
}

export function getPlanDefinition(planId: string | null | undefined) {
  if (!planId) {
    return PLAN_DEFINITIONS.starter;
  }

  return PLAN_DEFINITIONS[planId as PlanId] ?? PLAN_DEFINITIONS.starter;
}
