import { serve } from "bun";

const server = serve({
  port: process.env.PORT || 3000,
  routes: {
    "/": new Response("Welcome to Alan Frontdesk AI Backend"),
    "/health": new Response(JSON.stringify({ status: "ok" }), {
      headers: { "Content-Type": "application/json" },
    }),
    "/api/v1/*": {
      GET: (req) => {
        return new Response(JSON.stringify({ message: "API v1 endpoint" }), {
          headers: { "Content-Type": "application/json" },
        });
      },
      POST: async (req) => {
        const body = await req.json();
        return new Response(JSON.stringify({ received: body }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
  fetch(req) {
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server running at http://localhost:${server.port}`);
