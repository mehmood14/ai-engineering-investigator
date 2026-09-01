import "dotenv/config";
import cors from "@fastify/cors";
import Fastify from "fastify";

import { streamInvestigation } from "./services/agent.service.js";
import { normalizeRepository } from "./utils/repository.js";

const app = Fastify({
  logger: true,
});

const frontendOrigin = process.env["FRONTEND_ORIGIN"] ?? "http://localhost:5173";
const port = Number(process.env["PORT"] ?? "3001");

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}

await app.register(cors, {
  origin: frontendOrigin,
});

app.post("/api/investigations/stream", async (request, reply) => {
  const body = request.body as {
    message?: string;
    repository?: unknown;
  };

  if (!body.message?.trim()) {
    return reply.status(400).send({
      error: "message is required",
    });
  }

  const repository = normalizeRepository(body.repository);

  if (!repository) {
    return reply.status(400).send({
      error:
        "repository must be in owner/repository or https://github.com/owner/repository format",
    });
  }

  reply.hijack();

  reply.raw.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",

    // Required because we're writing directly to raw response
    "Access-Control-Allow-Origin": frontendOrigin,
  });

  try {
    for await (const event of streamInvestigation(body.message, repository)) {
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
  port,
  host: "0.0.0.0",
});
