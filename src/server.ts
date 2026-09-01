import "dotenv/config";
import cors from "@fastify/cors";
import Fastify from "fastify";

import { streamInvestigation } from "./services/agent.service.js";

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: "http://localhost:5173",
});

app.post("/api/investigations/stream", async (request, reply) => {
  const body = request.body as {
    message?: string;
  };

  if (!body.message?.trim()) {
    return reply.status(400).send({
      error: "message is required",
    });
  }

  reply.hijack();

  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",

    // Required because we're writing directly to raw response
    "Access-Control-Allow-Origin": "http://localhost:5173",
  });

  try {
    for await (const event of streamInvestigation(body.message)) {
      reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Investigation failed";

    reply.raw.write(
      `data: ${JSON.stringify({
        type: "error",
        message,
      })}\n\n`,
    );
  } finally {
    reply.raw.end();
  }
});

await app.listen({
  port: 3001,
  host: "0.0.0.0",
});
