/**
 * Chat Service - Manages conversations and routes messages through RAG
 * Handles conversation lifecycle, message persistence, and action handling
 */

import prisma from "./db";
import { generateRAGResponse, type RAGResponse } from "./ragService";
import { enqueueAction } from "./actionQueue";

interface ChatRequest {
  agentId: string;
  message: string;
  conversationId?: string;
  customerName?: string;
}

interface ChatResponse {
  conversationId: string;
  reply: string;
  sources: string[];
  action?: {
    type: string;
    data: Record<string, any>;
  };
}

/**
 * Process a chat message
 * Creates or continues a conversation, runs RAG, saves messages
 */
export async function processChat(req: ChatRequest): Promise<ChatResponse> {
  // Validate agent exists and is active
  const agent = await prisma.agent.findUnique({
    where: { id: req.agentId },
  });

  if (!agent) {
    throw new Error(`Agent not found: ${req.agentId}`);
  }

  if (!agent.isActive) {
    throw new Error(`Agent is not active: ${req.agentId}`);
  }

  // Get or create conversation - scoped to this agent
  let conversationId = req.conversationId;
  if (!conversationId) {
    const conversation = await prisma.conversation.create({
      data: {
        agentId: req.agentId,
        customerName: req.customerName,
        status: "active",
      },
    });
    conversationId = conversation.id;
  } else {
    // Verify conversation belongs to this agent (data isolation)
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        agentId: req.agentId,
      },
    });

    if (!conversation) {
      throw new Error("Conversation not found or does not belong to this agent");
    }
  }

  // Save user message
  await prisma.message.create({
    data: {
      conversationId,
      role: "user",
      content: req.message,
    },
  });

  // Get conversation history for context
  const history = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: { role: true, content: true },
  });

  // Run RAG pipeline - agent's system prompt + agent's knowledge only
  const ragResponse: RAGResponse = await generateRAGResponse(
    req.agentId,
    req.message,
    history.slice(0, -1), // Exclude the message we just saved (it's the current query)
    agent.systemPrompt
  );

  // Save assistant response
  const assistantMessage = await prisma.message.create({
    data: {
      conversationId,
      role: "assistant",
      content: ragResponse.reply,
      sources: ragResponse.sources,
      action: ragResponse.action || undefined,
    },
  });

  // Enqueue actions for async processing
  if (ragResponse.action) {
    await handleAction(req.agentId, conversationId, assistantMessage.id, ragResponse.action);
  }

  return {
    conversationId,
    reply: ragResponse.reply,
    sources: ragResponse.sources,
    action: ragResponse.action,
  };
}

/**
 * Handle detected actions by enqueuing them for async processing
 */
async function handleAction(
  agentId: string,
  conversationId: string,
  messageId: string,
  action: { type: string; data: Record<string, any> }
): Promise<void> {
  await enqueueAction({
    agentId,
    conversationId,
    messageId,
    actionType: action.type,
    payload: action.data,
  });
}

/**
 * Get conversation history
 */
export async function getConversationHistory(
  agentId: string,
  conversationId: string
): Promise<{ role: string; content: string; createdAt: Date }[]> {
  // Verify conversation belongs to agent (data isolation)
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationId,
      agentId,
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found or does not belong to this agent");
  }

  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: { role: true, content: true, createdAt: true },
  });
}

/**
 * List conversations for an agent
 */
export async function listConversations(agentId: string) {
  return prisma.conversation.findMany({
    where: { agentId },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, role: true, createdAt: true },
      },
    },
  });
}

export type { ChatRequest, ChatResponse };
