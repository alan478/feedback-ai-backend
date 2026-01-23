import { serve } from "bun";
import { processOnboardingInput, initializeOnboarding } from "./services/onboardingService";
import type { OnboardingState } from "./types/onboarding";

// In-memory storage for onboarding sessions (replace with DB in production)
const onboardingSessions = new Map<string, OnboardingState>();

const server = serve({
  port: process.env.PORT || 3000,
  routes: {
    "/": new Response("Welcome to Alan Frontdesk AI Backend"),
    "/health": new Response(JSON.stringify({ status: "ok" }), {
      headers: { "Content-Type": "application/json" },
    }),

    // Initialize onboarding session
    "/api/v1/onboarding/start": {
      POST: (req) => {
        const sessionId = crypto.randomUUID();
        const state = initializeOnboarding();
        onboardingSessions.set(sessionId, state);

        return new Response(
          JSON.stringify({
            sessionId,
            message: "Tell me about your business in one sentence and I'll create a custom assistant for you.",
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
        const body = await req.json();
        const { sessionId, message, niche } = body;

        if (!sessionId || (!message && !niche)) {
          return new Response(
            JSON.stringify({ error: "Missing sessionId or message/niche" }),
            { status: 400, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
          );
        }

        let state = onboardingSessions.get(sessionId);
        if (!state) {
          // Session not found, create new one
          state = initializeOnboarding();
        }

        // Process the input - if niche is provided directly, use quick start flow
        const response = niche
          ? processOnboardingInput(message || "", state, niche)
          : processOnboardingInput(message, state);

        // Update session
        onboardingSessions.set(sessionId, response.state);

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
      GET: (req) => {
        const sessionId = req.params.sessionId;
        const state = onboardingSessions.get(sessionId);

        if (!state) {
          return new Response(
            JSON.stringify({ error: "Session not found" }),
            { status: 404, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
          );
        }

        return new Response(JSON.stringify({ state }), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      },
    },

    // Complete onboarding and create agent
    "/api/v1/onboarding/complete": {
      POST: async (req) => {
        const body = await req.json();
        const { sessionId } = body;

        const state = onboardingSessions.get(sessionId);
        if (!state) {
          return new Response(
            JSON.stringify({ error: "Session not found" }),
            { status: 404, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
          );
        }

        // Mark as completed
        state.onboardingCompleted = true;
        state.createdAt = new Date();

        // TODO: Create agent in database
        const agentId = crypto.randomUUID();

        // Clean up session
        onboardingSessions.delete(sessionId);

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
