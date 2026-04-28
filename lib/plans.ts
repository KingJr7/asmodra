export type PlanId = "starter" | "pro" | "business";
export type CreditPackId = "credits_5" | "credits_35" | "credits_80" | "credits_180";
export type StoreItemId = PlanId | CreditPackId;

export type PlanDefinition = {
  id: PlanId;
  name: string;
  monthlyPriceXaf: number;
  monthlyQuota: number;
  watermark: boolean;
  description: string;
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
    monthlyQuota: 17,
    watermark: true,
    description: "Pour lancer les premiers visuels en credits, avec signature Asmodra.",
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyPriceXaf: 15000,
    monthlyQuota: 260,
    watermark: false,
    description: "Pour les independants qui produisent regulierement avec un cout/credit optimise.",
  },
  business: {
    id: "business",
    name: "Business",
    monthlyPriceXaf: 35000,
    monthlyQuota: 760,
    watermark: false,
    description: "Pour les equipes avec production continue et gros volume de generations.",
  },
};

export const PLAN_LIST = Object.values(PLAN_DEFINITIONS);

export const CREDIT_PACK_DEFINITIONS: Record<CreditPackId, CreditPackDefinition> = {
  credits_5: {
    id: "credits_5",
    name: "Top-up 5",
    priceXaf: 1000,
    credits: 5,
    description: "Recharge rapide pour finir une generation ou une retouche sans prendre un gros pack.",
  },
  credits_35: {
    id: "credits_35",
    name: "Pack 35",
    priceXaf: 5000,
    credits: 35,
    description: "Pack flexible pour absorber les pics de generation, utilisable meme sans abonnement payant.",
  },
  credits_80: {
    id: "credits_80",
    name: "Pack 80",
    priceXaf: 10000,
    credits: 80,
    description: "Le meilleur compromis pour usage hebdomadaire avec retouches et references.",
  },
  credits_180: {
    id: "credits_180",
    name: "Pack 180",
    priceXaf: 20000,
    credits: 180,
    description: "Gros volume pour campagnes multiples et iterations creatives frequentes.",
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
