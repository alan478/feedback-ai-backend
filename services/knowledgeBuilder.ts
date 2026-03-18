/**
 * Knowledge Builder - Chunks onboarding data and stores embeddings
 * Runs once after onboarding completes to build the agent's knowledge base
 */

import prisma from "./db";
import { generateEmbeddings } from "./embeddingService";
import type { OnboardingState } from "../types/onboarding";

interface KnowledgeChunkInput {
  category: string;
  content: string;
  metadata?: Record<string, any>;
}

/**
 * Build knowledge base from onboarding state
 * Chunks the business data by category, embeds each chunk, stores in DB
 */
export async function buildKnowledgeBase(
  agentId: string,
  state: OnboardingState
): Promise<number> {
  const chunks = chunkOnboardingData(state);

  if (chunks.length === 0) {
    throw new Error("No knowledge chunks generated from onboarding data");
  }

  // Generate embeddings for all chunks in batch
  const texts = chunks.map((c) => c.content);
  const embeddings = await generateEmbeddings(texts);

  // Store each chunk with its embedding using raw SQL (pgvector)
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]!;
    const embedding = embeddings[i]!;
    const vectorStr = `[${embedding.join(",")}]`;

    await prisma.$executeRawUnsafe(
      `INSERT INTO "KnowledgeChunk" (id, "agentId", category, content, embedding, metadata, "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4::vector, $5::jsonb, NOW())`,
      agentId,
      chunk.category,
      chunk.content,
      vectorStr,
      JSON.stringify(chunk.metadata || {})
    );
  }

  return chunks.length;
}

/**
 * Delete all knowledge chunks for an agent (used for re-building)
 */
export async function clearKnowledgeBase(agentId: string): Promise<void> {
  await prisma.knowledgeChunk.deleteMany({ where: { agentId } });
}

/**
 * Chunk onboarding data into focused, searchable pieces
 * Each chunk covers one topic so RAG retrieval is precise
 */
function chunkOnboardingData(state: OnboardingState): KnowledgeChunkInput[] {
  const chunks: KnowledgeChunkInput[] = [];
  const biz = state.businessName || "the business";

  // General business identity
  if (state.businessDescription) {
    chunks.push({
      category: "general",
      content: `${biz} is a ${state.niche?.replace(/_/g, " ") || "business"}. ${state.businessDescription}`,
      metadata: { niche: state.niche, industry: state.industry },
    });
  }

  // Niche-specific chunks (dentist focused for now)
  if (state.niche === "dental_clinic" && state.nicheData?.dental) {
    const dental = state.nicheData.dental;

    // Services
    if (dental.services?.length) {
      chunks.push({
        category: "services",
        content: `${biz} offers the following dental services: ${dental.services.join(", ")}. Patients can inquire about or book any of these services.`,
        metadata: { services: dental.services },
      });
    }

    // Insurance
    chunks.push({
      category: "insurance",
      content: dental.acceptsInsurance
        ? `${biz} accepts dental insurance. Patients should bring their insurance card to their appointment.`
        : `${biz} does not accept insurance. Payment is expected at the time of service.`,
      metadata: { acceptsInsurance: dental.acceptsInsurance },
    });

    // Emergency
    chunks.push({
      category: "emergency",
      content: dental.emergencyHours
        ? `${biz} provides emergency dental care. For dental emergencies outside regular hours, patients should call the office emergency line.`
        : `${biz} does not offer emergency hours. For dental emergencies, patients should visit the nearest emergency room or call 911.`,
      metadata: { emergencyHours: dental.emergencyHours },
    });

    // Booking lead time
    if (dental.bookingLeadTime) {
      chunks.push({
        category: "booking",
        content: `Appointments at ${biz} should be booked ${dental.bookingLeadTime} in advance. Patients can schedule by contacting the office.`,
        metadata: { bookingLeadTime: dental.bookingLeadTime },
      });
    }
  }

  // Primary services (generic, works for any niche)
  if (state.primaryServices?.length) {
    chunks.push({
      category: "services",
      content: `${biz} provides the following services: ${state.primaryServices.join(", ")}.`,
      metadata: { services: state.primaryServices },
    });
  }

  // Agent capabilities
  if (state.agentCapabilities?.length) {
    const capabilityDescriptions: Record<string, string> = {
      answer_questions: "answer questions about the business",
      take_bookings: "help schedule appointments and bookings",
      process_orders: "process orders",
      provide_quotes: "provide price quotes and estimates",
      collect_leads: "collect contact information for follow-up",
      give_recommendations: "give personalized recommendations",
      handle_complaints: "handle complaints and feedback",
      check_availability: "check availability and scheduling",
      track_orders: "help track orders",
    };

    const capabilities = state.agentCapabilities
      .map((c) => capabilityDescriptions[c] || c)
      .join(", ");

    chunks.push({
      category: "capabilities",
      content: `The AI assistant for ${biz} can: ${capabilities}. For anything outside these capabilities, the assistant will ${
        state.escalationStrategy === "human_handoff"
          ? "transfer to a human team member"
          : state.escalationStrategy === "collect_and_notify"
          ? "collect the customer's information and have a team member follow up"
          : "do its best to help"
      }.`,
      metadata: {
        capabilities: state.agentCapabilities,
        escalation: state.escalationStrategy,
      },
    });
  }

  // Escalation details
  if (state.escalationStrategy && state.escalationStrategy !== "full_auto") {
    chunks.push({
      category: "escalation",
      content: `When the AI assistant cannot fully help a customer at ${biz}, the escalation process is: ${
        state.escalationStrategy === "human_handoff"
          ? "The conversation will be transferred to a human team member for further assistance."
          : state.escalationStrategy === "collect_and_notify"
          ? "The assistant will collect the customer's name and contact details, then notify the team to follow up."
          : state.escalationStrategy === "faq_only"
          ? "The assistant will only answer known questions. For anything else, it will suggest contacting the business directly."
          : "The assistant will handle the situation automatically."
      }${state.handoffContact ? ` Contact: ${state.handoffContact}` : ""}`,
      metadata: { strategy: state.escalationStrategy },
    });
  }

  // Website
  if (state.websiteUrl) {
    chunks.push({
      category: "contact",
      content: `${biz} website: ${state.websiteUrl}. Customers can visit the website for more information.`,
      metadata: { url: state.websiteUrl },
    });
  }

  return chunks;
}

export { chunkOnboardingData };
