/**
 * Agent Pipeline - Orchestrates agent creation from onboarding data
 * This is the main entry point after onboarding completes:
 * 1. Create Agent record in DB
 * 2. Generate system prompt
 * 3. Build knowledge base (chunk + embed + store)
 */

import prisma from "./db";
import { generateSystemPrompt } from "../prompts/dentistAgent";
import { buildKnowledgeBase, clearKnowledgeBase } from "./knowledgeBuilder";
import type { OnboardingState } from "../types/onboarding";

interface CreateAgentResult {
  agentId: string;
  chunksCreated: number;
  systemPrompt: string;
}

/**
 * Create a fully operational AI agent from onboarding data
 */
export async function createAgentFromOnboarding(
  state: OnboardingState
): Promise<CreateAgentResult> {
  // Step 1: Generate system prompt based on niche
  const basePrompt = generateSystemPrompt({
    businessName: state.businessName || "Business",
    niche: state.niche || "generic",
    tone: state.tone || "friendly",
    capabilities: state.agentCapabilities || ["answer_questions"],
    escalationStrategy: state.escalationStrategy || "collect_and_notify",
    handoffContact: state.handoffContact,
  });

  // Enhance with strict RAG instructions
  const systemPrompt = `${basePrompt}

## CRITICAL: Context-Based Answering Rules
- You MUST answer ONLY using the CONTEXT provided below. Do NOT use general knowledge.
- When the context contains specific details (services, hours, policies, prices), LIST them explicitly in your response.
- Do NOT give vague or generic responses. Be specific and reference actual details from the context.
- If the context does not contain information to answer the question, say: "I don't have that specific information right now. Let me connect you with our team for an accurate answer."
- NEVER make up or fabricate information that is not in the provided context.`;

  // Step 2: Create Agent in DB
  const agent = await prisma.agent.create({
    data: {
      businessName: state.businessName || "Business",
      businessDescription: state.businessDescription || null,
      niche: state.niche || "generic",
      tone: state.tone || "friendly",
      systemPrompt,
      config: JSON.parse(JSON.stringify(state)), // Full state snapshot
      escalationStrategy: state.escalationStrategy || "collect_and_notify",
      handoffContact: state.handoffContact || null,
    },
  });

  // Step 3: Build knowledge base (chunk + embed + store vectors)
  const chunksCreated = await buildKnowledgeBase(agent.id, state);

  return {
    agentId: agent.id,
    chunksCreated,
    systemPrompt,
  };
}

/**
 * Rebuild an agent's knowledge base (e.g., after editing in Agent Studio)
 */
export async function rebuildAgentKnowledge(agentId: string): Promise<number> {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
  });

  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`);
  }

  // Clear existing knowledge
  await clearKnowledgeBase(agentId);

  // Rebuild from stored config
  const state = agent.config as unknown as OnboardingState;
  return buildKnowledgeBase(agentId, state);
}

/**
 * Get agent details
 */
export async function getAgent(agentId: string) {
  return prisma.agent.findUnique({
    where: { id: agentId },
    include: {
      _count: {
        select: {
          knowledgeChunks: true,
          conversations: true,
        },
      },
    },
  });
}

/**
 * Deactivate an agent (soft delete)
 */
export async function deactivateAgent(agentId: string) {
  return prisma.agent.update({
    where: { id: agentId },
    data: { isActive: false },
  });
}
