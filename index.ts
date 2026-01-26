import { serve } from "bun";
import { processOnboardingInput } from "./services/onboardingService";
import {
  createSession,
  getSession,
  getSessionRecord,
  updateSession,
  completeSession,
} from "./services/onboardingSessionStore";
import { createAgentFromOnboarding } from "./services/agentService";
import { getIndustryFromNiche } from "./services/nicheDetection";
import type { NicheType } from "./types/onboarding";

const server = serve({
  port: process.env.PORT || 3000,
  routes: {
    "/": new Response("Welcome to Alan Frontdesk AI Backend"),
    "/health": new Response(JSON.stringify({ status: "ok" }), {
      headers: { "Content-Type": "application/json" },
    }),

    // Initialize onboarding session
    "/api/v1/onboarding/start": {
      POST: async (req) => {
        const { id: sessionId, state } = await createSession();

        return new Response(
          JSON.stringify({
            sessionId,
            message:
              "Tell me about your business in one sentence and I'll create a custom assistant for you.",
            stage: 0,
            state,
          }),
          {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      },
    },

    // Process onboarding input
    "/api/v1/onboarding/message": {
      POST: async (req) => {
        const body = await req.json() as { sessionId?: string; message?: string; niche?: string };
        const { sessionId, message, niche } = body;

        // Allow empty message if niche is provided (business type selection)
        if (!sessionId || (!message && !niche)) {
          return new Response(
            JSON.stringify({ error: "Missing sessionId or message" }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
        }

        const record = await getSessionRecord(sessionId);
        if (!record) {
          return new Response(
            JSON.stringify({ error: "Session not found" }),
            {
              status: 404,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
        }

        if (record.completed) {
          return new Response(
            JSON.stringify({ error: "Session already completed" }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
        }

        let state = record.state as unknown as import("./types/onboarding").OnboardingState;

        // If niche is provided directly (business type selection from modal),
        // skip to niche-specific questions
        if (niche && !message && state.currentStage === 0) {
          state.niche = niche as NicheType;
          state.industry = getIndustryFromNiche(niche as NicheType);
          state.nicheConfidence = 1.0;
          state.currentStage = 2; // NICHE_DETECTION stage
          state.businessDescription = `Selected business type: ${niche}`;
        }

        // Process the input (use niche if message is empty)
        const inputMessage = message || niche || "";
        const response = processOnboardingInput(inputMessage, state);

        // Update session in DB
        await updateSession(sessionId, response.state);

        return new Response(JSON.stringify(response), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      },
    },

    // Get onboarding state
    "/api/v1/onboarding/state/:sessionId": {
      GET: async (req) => {
        const sessionId = req.params.sessionId;
        const sessionRecord = await getSessionRecord(sessionId);

        if (!sessionRecord) {
          return new Response(
            JSON.stringify({ error: "Session not found" }),
            {
              status: 404,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
        }

        return new Response(
          JSON.stringify({
            state: sessionRecord.state,
            completed: sessionRecord.completed,
            agentId: sessionRecord.agentId,
            currentStage: sessionRecord.currentStage,
          }),
          {
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            },
          }
        );
      },
    },

    // Complete onboarding and create agent
    "/api/v1/onboarding/complete": {
      POST: async (req) => {
        const body = await req.json() as { sessionId?: string };
        const { sessionId } = body;

        if (!sessionId) {
          return new Response(
            JSON.stringify({ error: "Missing sessionId" }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
        }

        const sessionRecord = await getSessionRecord(sessionId);
        if (!sessionRecord) {
          return new Response(
            JSON.stringify({ error: "Session not found" }),
            {
              status: 404,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
        }

        // Idempotency: if already completed, return existing agentId
        if (sessionRecord.completed && sessionRecord.agentId) {
          return new Response(
            JSON.stringify({
              success: true,
              agentId: sessionRecord.agentId,
              state: sessionRecord.state,
              message: "Your AI Front Desk has already been created!",
            }),
            {
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
        }

        const state = sessionRecord.state as unknown as import("./types/onboarding").OnboardingState;
        state.onboardingCompleted = true;
        state.createdAt = new Date();

        try {
          // Create agent in database
          // TODO: Replace "default-org" with real org from auth context
          const agentId = await createAgentFromOnboarding("default-org", state);

          // Link session to agent and mark complete
          await completeSession(sessionId, agentId);

          return new Response(
            JSON.stringify({
              success: true,
              agentId,
              state,
              message: "Your AI Front Desk has been created!",
            }),
            {
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to create agent";
          return new Response(
            JSON.stringify({ error: message, success: false }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
              },
            }
          );
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
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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

console.log(`Server running at http://localhost:${server.port}`);
