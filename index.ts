import { serve } from "bun";
import { processOnboardingInput, initializeOnboarding } from "./services/onboardingService";
import { createAgentFromOnboarding, getAgent, rebuildAgentKnowledge } from "./services/agentPipeline";
import { processChat, getConversationHistory, listConversations } from "./services/chatService";
import { startQueueProcessor } from "./services/actionQueue";
import { registerUser, loginUser } from "./services/authService";
import { requireAuth } from "./middleware/auth";
import prisma from "./services/db";
import { generateEmbedding } from "./services/embeddingService";
import { generateSystemPrompt } from "./prompts/dentistAgent";
import type { OnboardingState } from "./types/onboarding";

// In-memory storage for onboarding sessions (replace with DB in production)
const onboardingSessions = new Map<string, OnboardingState>();

// CORS headers helper
const corsHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

function errorResponse(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), { status, headers: corsHeaders });
}

const server = serve({
  port: process.env.PORT || 3000,
  routes: {
    "/": new Response("Welcome to Alan Frontdesk AI Backend"),
    "/health": new Response(JSON.stringify({ status: "ok" }), {
      headers: { "Content-Type": "application/json" },
    }),

    // ===== Onboarding Endpoints =====

    "/api/v1/onboarding/start": {
      POST: (req) => {
        const sessionId = crypto.randomUUID();
        const state = initializeOnboarding();
        onboardingSessions.set(sessionId, state);

        return jsonResponse({
          sessionId,
          message: "Tell me about your business in one sentence and I'll create a custom assistant for you.",
          stage: 0,
          state,
        });
      },
    },

    "/api/v1/onboarding/message": {
      POST: async (req) => {
        const body = await req.json() as { sessionId?: string; message?: string; niche?: string };
        const { sessionId, message, niche } = body;

        if (!sessionId || (!message && !niche)) {
          return errorResponse("Missing sessionId or message/niche");
        }

        let state = onboardingSessions.get(sessionId);
        if (!state) {
          state = initializeOnboarding();
        }

        const response = niche
          ? processOnboardingInput(message || "", state, niche)
          : processOnboardingInput(message, state);

        onboardingSessions.set(sessionId, response.state);

        return jsonResponse(response);
      },
    },

    "/api/v1/onboarding/state/:sessionId": {
      GET: (req) => {
        const sessionId = req.params.sessionId;
        const state = onboardingSessions.get(sessionId);

        if (!state) {
          return errorResponse("Session not found", 404);
        }

        return jsonResponse({ state });
      },
    },

    // Complete onboarding → Create AI Agent + Build Knowledge Base
    "/api/v1/onboarding/complete": {
      POST: async (req) => {
        try {
          const body = await req.json() as { sessionId?: string };
          const { sessionId } = body;

          const state = onboardingSessions.get(sessionId);
          if (!state) {
            return errorResponse("Session not found", 404);
          }

          state.onboardingCompleted = true;
          state.createdAt = new Date();

          // Create agent with full pipeline: DB + prompt + embeddings
          const result = await createAgentFromOnboarding(state);

          // Clean up session
          onboardingSessions.delete(sessionId);

          return jsonResponse({
            success: true,
            agentId: result.agentId,
            chunksCreated: result.chunksCreated,
            message: "Your AI Front Desk has been created!",
          });
        } catch (error: any) {
          console.error("Agent creation failed:", error);
          return errorResponse(`Agent creation failed: ${error.message}`, 500);
        }
      },
    },

    // ===== Chat Endpoints =====

    // Send a message to an agent
    "/api/v1/chat": {
      POST: async (req) => {
        try {
          const body = await req.json() as { agentId?: string; message?: string; conversationId?: string; customerName?: string };
          const { agentId, message, conversationId, customerName } = body;

          if (!agentId || !message) {
            return errorResponse("Missing agentId or message");
          }

          const response = await processChat({
            agentId,
            message,
            conversationId,
            customerName,
          });

          return jsonResponse(response);
        } catch (error: any) {
          console.error("Chat error:", error);
          return errorResponse(error.message, 500);
        }
      },
    },

    // Get conversation history
    "/api/v1/chat/:agentId/conversations/:conversationId": {
      GET: async (req) => {
        try {
          const { agentId, conversationId } = req.params;
          const messages = await getConversationHistory(agentId, conversationId);
          return jsonResponse({ messages });
        } catch (error: any) {
          return errorResponse(error.message, 404);
        }
      },
    },

    // List conversations for an agent
    "/api/v1/chat/:agentId/conversations": {
      GET: async (req) => {
        try {
          const { agentId } = req.params;
          const conversations = await listConversations(agentId);
          return jsonResponse({ conversations });
        } catch (error: any) {
          return errorResponse(error.message, 500);
        }
      },
    },

    // ===== Agent Endpoints =====

    // Get agent details + Update agent configuration
    "/api/v1/agents/:agentId": {
      GET: async (req) => {
        try {
          const agent = await getAgent(req.params.agentId);
          if (!agent) {
            return errorResponse("Agent not found", 404);
          }
          return jsonResponse({ agent });
        } catch (error: any) {
          return errorResponse(error.message, 500);
        }
      },
      PUT: async (req) => {
        try {
          const { agentId } = req.params;
          const body = await req.json() as Record<string, any>;

          const existing = await prisma.agent.findUnique({ where: { id: agentId } });
          if (!existing) {
            return errorResponse("Agent not found", 404);
          }

          const existingConfig = (existing.config as Record<string, any>) || {};
          const updatedConfig = body.config
            ? { ...existingConfig, ...body.config }
            : existingConfig;

          const updateData: Record<string, any> = { config: updatedConfig };
          if (body.businessName !== undefined) updateData.businessName = body.businessName;
          if (body.businessDescription !== undefined) updateData.businessDescription = body.businessDescription;
          if (body.niche !== undefined) updateData.niche = body.niche;
          if (body.tone !== undefined) updateData.tone = body.tone;
          if (body.escalationStrategy !== undefined) updateData.escalationStrategy = body.escalationStrategy;
          if (body.handoffContact !== undefined) updateData.handoffContact = body.handoffContact;

          // Regenerate system prompt
          updateData.systemPrompt = generateSystemPrompt({
            businessName: updateData.businessName || existing.businessName,
            niche: updateData.niche || existing.niche,
            tone: updateData.tone || existing.tone,
            capabilities: updatedConfig.agentCapabilities || [],
            escalationStrategy: updateData.escalationStrategy || existing.escalationStrategy,
            handoffContact: updateData.handoffContact ?? existing.handoffContact ?? undefined,
          });

          const agent = await prisma.agent.update({
            where: { id: agentId },
            data: updateData,
          });

          return jsonResponse({ agent });
        } catch (error: any) {
          return errorResponse(error.message, 500);
        }
      },
    },

    // Rebuild agent knowledge base
    "/api/v1/agents/:agentId/rebuild": {
      POST: async (req) => {
        try {
          const chunks = await rebuildAgentKnowledge(req.params.agentId);
          return jsonResponse({ success: true, chunksRebuilt: chunks });
        } catch (error: any) {
          return errorResponse(error.message, 500);
        }
      },
    },

    // ===== Knowledge Endpoints =====

    "/api/v1/agents/:agentId/knowledge": {
      GET: async (req) => {
        try {
          const { agentId } = req.params;
          const chunks = await prisma.knowledgeChunk.findMany({
            where: { agentId },
            select: {
              id: true,
              category: true,
              content: true,
              metadata: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
          });
          return jsonResponse({ chunks });
        } catch (error: any) {
          return errorResponse(error.message, 500);
        }
      },
      POST: async (req) => {
        try {
          const { agentId } = req.params;
          const body = await req.json() as { text?: string; type?: string };
          const { text, type } = body;

          if (!text || !type) {
            return errorResponse("text and type are required");
          }

          const agent = await prisma.agent.findUnique({ where: { id: agentId } });
          if (!agent) {
            return errorResponse("Agent not found", 404);
          }

          const embedding = await generateEmbedding(text);
          const vectorStr = `[${embedding.join(",")}]`;

          await prisma.$executeRawUnsafe(
            `INSERT INTO "KnowledgeChunk" (id, "agentId", category, content, embedding, metadata, "createdAt")
             VALUES (gen_random_uuid()::text, $1, $2, $3, $4::vector, $5::jsonb, NOW())`,
            agentId,
            type,
            text,
            vectorStr,
            JSON.stringify({ addedManually: true, type })
          );

          return jsonResponse({ success: true, message: "Knowledge added" }, 201);
        } catch (error: any) {
          return errorResponse(error.message, 500);
        }
      },
    },

    "/api/v1/agents/:agentId/knowledge/:chunkId": {
      DELETE: async (req) => {
        try {
          const { agentId, chunkId } = req.params;

          const chunk = await prisma.knowledgeChunk.findFirst({
            where: { id: chunkId, agentId },
          });
          if (!chunk) {
            return errorResponse("Knowledge chunk not found", 404);
          }

          await prisma.knowledgeChunk.delete({ where: { id: chunkId } });
          return jsonResponse({ success: true });
        } catch (error: any) {
          return errorResponse(error.message, 500);
        }
      },
    },

    // ===== Dashboard / Action Queue Endpoints =====

    // List bookings for an agent
    "/api/v1/agents/:agentId/bookings": {
      GET: async (req) => {
        try {
          const { agentId } = req.params;
          const url = new URL(req.url);
          const page = parseInt(url.searchParams.get("page") || "1", 10);
          const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100);
          const skip = (page - 1) * limit;

          const [bookings, total] = await Promise.all([
            prisma.booking.findMany({
              where: { agentId },
              orderBy: { createdAt: "desc" },
              skip,
              take: limit,
            }),
            prisma.booking.count({ where: { agentId } }),
          ]);

          return jsonResponse({ bookings, total, page, limit });
        } catch (error: any) {
          return errorResponse(error.message, 500);
        }
      },
    },

    // List leads for an agent
    "/api/v1/agents/:agentId/leads": {
      GET: async (req) => {
        try {
          const { agentId } = req.params;
          const url = new URL(req.url);
          const page = parseInt(url.searchParams.get("page") || "1", 10);
          const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100);
          const skip = (page - 1) * limit;

          const [leads, total] = await Promise.all([
            prisma.lead.findMany({
              where: { agentId },
              orderBy: { createdAt: "desc" },
              skip,
              take: limit,
            }),
            prisma.lead.count({ where: { agentId } }),
          ]);

          return jsonResponse({ leads, total, page, limit });
        } catch (error: any) {
          return errorResponse(error.message, 500);
        }
      },
    },

    // List escalations for an agent
    "/api/v1/agents/:agentId/escalations": {
      GET: async (req) => {
        try {
          const { agentId } = req.params;
          const url = new URL(req.url);
          const page = parseInt(url.searchParams.get("page") || "1", 10);
          const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100);
          const skip = (page - 1) * limit;

          const [escalations, total] = await Promise.all([
            prisma.escalation.findMany({
              where: { agentId },
              orderBy: { createdAt: "desc" },
              skip,
              take: limit,
            }),
            prisma.escalation.count({ where: { agentId } }),
          ]);

          return jsonResponse({ escalations, total, page, limit });
        } catch (error: any) {
          return errorResponse(error.message, 500);
        }
      },
    },

    // Action stats for an agent
    "/api/v1/agents/:agentId/actions/stats": {
      GET: async (req) => {
        try {
          const { agentId } = req.params;

          const [totalBookings, totalLeads, totalEscalations, pendingActions] = await Promise.all([
            prisma.booking.count({ where: { agentId } }),
            prisma.lead.count({ where: { agentId } }),
            prisma.escalation.count({ where: { agentId } }),
            prisma.actionQueue.count({ where: { agentId, status: "pending" } }),
          ]);

          return jsonResponse({ totalBookings, totalLeads, totalEscalations, pendingActions });
        } catch (error: any) {
          return errorResponse(error.message, 500);
        }
      },
    },

    // Update booking status
    "/api/v1/bookings/:id": {
      PATCH: async (req) => {
        try {
          const { id } = req.params;
          const body = await req.json() as { status?: string; notes?: string };

          const booking = await prisma.booking.update({
            where: { id },
            data: {
              ...(body.status && { status: body.status }),
              ...(body.notes !== undefined && { notes: body.notes }),
            },
          });

          return jsonResponse({ booking });
        } catch (error: any) {
          return errorResponse(error.message, 500);
        }
      },
    },

    // Update escalation (assign, resolve)
    "/api/v1/escalations/:id": {
      PATCH: async (req) => {
        try {
          const { id } = req.params;
          const body = await req.json() as { status?: string; assignedTo?: string };

          const data: Record<string, any> = {};
          if (body.status) data.status = body.status;
          if (body.assignedTo) data.assignedTo = body.assignedTo;
          if (body.status === "resolved") data.resolvedAt = new Date();

          const escalation = await prisma.escalation.update({
            where: { id },
            data,
          });

          return jsonResponse({ escalation });
        } catch (error: any) {
          return errorResponse(error.message, 500);
        }
      },
    },

    // ===== Auth Endpoints =====

    "/api/v1/auth/register": {
      POST: async (req) => {
        try {
          const body = await req.json() as { email?: string; password?: string; name?: string };
          const { email, password, name } = body;

          if (!email || !password) {
            return errorResponse("Email and password are required", 400);
          }

          const result = await registerUser(email, password, name);
          return jsonResponse(result, 201);
        } catch (error: any) {
          const status = error.status || 500;
          return errorResponse(error.message, status);
        }
      },
    },

    "/api/v1/auth/login": {
      POST: async (req) => {
        try {
          const body = await req.json() as { email?: string; password?: string };
          const { email, password } = body;

          if (!email || !password) {
            return errorResponse("Email and password are required", 400);
          }

          const result = await loginUser(email, password);
          return jsonResponse(result);
        } catch (error: any) {
          const status = error.status || 500;
          return errorResponse(error.message, status);
        }
      },
    },

    "/api/v1/auth/me": {
      GET: async (req) => {
        try {
          const auth = await requireAuth(req);

          const user = await prisma.user.findUnique({
            where: { id: auth.userId },
            select: {
              id: true,
              email: true,
              name: true,
              agents: {
                select: { id: true, businessName: true, niche: true, isActive: true },
              },
            },
          });

          if (!user) {
            return errorResponse("User not found", 404);
          }

          return jsonResponse({
            user: {
              ...user,
              agents: user.agents.map((a) => ({
                ...a,
                status: a.isActive ? "active" : "inactive",
              })),
            },
          });
        } catch (error: any) {
          const status = error.status || 500;
          return errorResponse(error.message, status);
        }
      },
    },

    "/api/v1/auth/claim-agent": {
      POST: async (req) => {
        try {
          const auth = await requireAuth(req);
          const body = await req.json() as { agentId?: string };
          const { agentId } = body;

          if (!agentId) {
            return errorResponse("agentId is required", 400);
          }

          const agent = await prisma.agent.findUnique({ where: { id: agentId } });
          if (!agent) {
            return errorResponse("Agent not found", 404);
          }

          if (agent.userId) {
            return errorResponse("Agent is already claimed", 409);
          }

          const updated = await prisma.agent.update({
            where: { id: agentId },
            data: { userId: auth.userId },
            select: { id: true, businessName: true, userId: true },
          });

          return jsonResponse({ agent: updated });
        } catch (error: any) {
          const status = error.status || 500;
          return errorResponse(error.message, status);
        }
      },
    },

    "/api/v1/users/:userId/agents": {
      GET: async (req) => {
        try {
          const auth = await requireAuth(req);
          const { userId } = req.params;

          if (auth.userId !== userId) {
            return errorResponse("Forbidden", 403);
          }

          const agents = await prisma.agent.findMany({
            where: { userId },
            select: {
              id: true,
              businessName: true,
              businessDescription: true,
              niche: true,
              isActive: true,
              createdAt: true,
            },
          });

          return jsonResponse({ agents });
        } catch (error: any) {
          const status = error.status || 500;
          return errorResponse(error.message, status);
        }
      },
    },

    // Handle OPTIONS for CORS
    "/api/v1/*": {
      OPTIONS: (req) => {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        });
      },
    },
  },
  fetch(req) {
    return new Response("Not Found", { status: 404 });
  },
});

// Start the action queue processor
startQueueProcessor();

console.log(`Server running at http://localhost:${server.port}`);
