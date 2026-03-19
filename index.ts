import { serve } from "bun";
import { processOnboardingInput, initializeOnboarding } from "./services/onboardingService";
import { createAgentFromOnboarding, getAgent, rebuildAgentKnowledge } from "./services/agentPipeline";
import { processChat, getConversationHistory, listConversations } from "./services/chatService";
import { startQueueProcessor } from "./services/actionQueue";
import prisma from "./services/db";
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

    // Get agent details
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
