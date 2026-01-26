import prisma from "../lib/db";
import type { OnboardingState } from "../types/onboarding";
import type { AgentConfig } from "../types/agentConfig";

/**
 * Create an Agent record from a completed onboarding state.
 * Called when onboarding completes.
 */
const VALID_NICHES = [
  "dental_clinic", "medical_practice", "therapy_practice",
  "boutique_retail", "ecommerce_store", "restaurant",
  "salon_spa", "gym_fitness", "saas_product",
  "consulting_firm", "law_office", "real_estate_agency",
  "hotel_hospitality", "auto_dealership", "home_services",
  "tutoring_education", "generic",
];

export async function createAgentFromOnboarding(
  orgId: string,
  state: OnboardingState
): Promise<string> {
  if (!state.businessName || state.businessName.trim().length === 0) {
    throw new Error("Business name is required to create an agent");
  }

  if (state.niche && !VALID_NICHES.includes(state.niche)) {
    throw new Error(`Invalid business niche: ${state.niche}`);
  }

  const config: AgentConfig = {
    capabilities: state.agentCapabilities ?? ["answer_questions"],
    escalationStrategy: state.escalationStrategy ?? "human_handoff",
    handoffContact: state.handoffContact,
    tone: state.tone ?? "friendly",
    language: state.language ?? "en",
    responseStyle: state.responseStyle ?? "concise",
    knowledgeSources: state.knowledgeSources ?? [],
    websiteUrl: state.websiteUrl,
    nicheData: state.nicheData,
  };

  const agent = await prisma.agent.create({
    data: {
      orgId,
      name: state.businessName ?? "AI Front Desk",
      niche: state.niche ?? null,
      industry: state.industry ?? null,
      greeting: `Welcome to ${state.businessName ?? "our business"}! How can I help you today?`,
      status: "draft",
      config: config as any,
    },
  });

  return agent.id;
}
