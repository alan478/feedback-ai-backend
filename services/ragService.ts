/**
 * RAG Service - Retrieval-Augmented Generation
 * Searches knowledge base for relevant context, then generates a response
 */

import prisma from "./db";
import { generateEmbedding, generateChatCompletion } from "./embeddingService";

interface RAGContext {
  content: string;
  category: string;
  similarity: number;
}

interface RAGResponse {
  reply: string;
  sources: string[];
  action?: {
    type: string;
    data: Record<string, any>;
  };
}

/**
 * Search the knowledge base for chunks relevant to the query
 * Uses cosine similarity via pgvector
 */
export async function searchKnowledge(
  agentId: string,
  query: string,
  topK: number = 5,
  minSimilarity: number = 0.2
): Promise<RAGContext[]> {
  // Embed the query
  const queryEmbedding = await generateEmbedding(query);
  const vectorStr = `[${queryEmbedding.join(",")}]`;

  // Vector similarity search - scoped to this agent only
  const results: RAGContext[] = await prisma.$queryRawUnsafe(
    `SELECT content, category,
            1 - (embedding <=> $1::vector) AS similarity
     FROM "KnowledgeChunk"
     WHERE "agentId" = $2
       AND 1 - (embedding <=> $1::vector) > $3
     ORDER BY embedding <=> $1::vector
     LIMIT $4`,
    vectorStr,
    agentId,
    minSimilarity,
    topK
  );

  return results;
}

/**
 * Generate a response using RAG
 * 1. Search knowledge base for relevant context
 * 2. Build prompt with system prompt + context + history + user message
 * 3. Generate response via Grok
 * 4. Parse any actions from the response
 */
export async function generateRAGResponse(
  agentId: string,
  userMessage: string,
  conversationHistory: { role: string; content: string }[],
  systemPrompt: string
): Promise<RAGResponse> {
  // Step 1: Retrieve relevant knowledge
  const contexts = await searchKnowledge(agentId, userMessage);

  // Step 2: Build the context block
  const contextBlock =
    contexts.length > 0
      ? contexts.map((c) => `[${c.category.toUpperCase()}]: ${c.content}`).join("\n\n")
      : "No specific information available for this query.";

  // Step 3: Build messages array for LLM
  const messages: { role: string; content: string }[] = [
    {
      role: "system",
      content: `${systemPrompt}\n\n## CONTEXT (from knowledge base)\n${contextBlock}`,
    },
    // Include last 10 messages of conversation history for context
    ...conversationHistory.slice(-10),
    {
      role: "user",
      content: userMessage,
    },
  ];

  // Step 4: Generate response
  const rawReply = await generateChatCompletion(messages, {
    temperature: 0.7,
    maxTokens: 512,
  });

  // Step 5: Parse action if present
  const { reply, action } = parseAction(rawReply || "");

  return {
    reply,
    sources: contexts.map((c) => c.category),
    action,
  };
}

/**
 * Parse ACTION: {...} from the response if present
 */
function parseAction(response: string): {
  reply: string;
  action?: { type: string; data: Record<string, any> };
} {
  const actionRegex = /ACTION:\s*(\{[\s\S]*?\})\s*$/;
  const match = response.match(actionRegex);

  if (match) {
    try {
      const action = JSON.parse(match[1]);
      const reply = response.replace(actionRegex, "").trim();
      return { reply, action };
    } catch {
      // If JSON parsing fails, return full response without action
      return { reply: response };
    }
  }

  return { reply: response };
}

export type { RAGContext, RAGResponse };
