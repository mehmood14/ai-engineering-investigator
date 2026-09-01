import { InMemoryRunner } from "@google/adk";
import { rootAgent } from "../agent.js";

const APP_NAME = "ai_engineering_investigator";

const runner = new InMemoryRunner({
  agent: rootAgent,
  appName: APP_NAME,
});

type InvestigationEvent =
  | {
      type: "tool_started";
      tool: string;
    }
  | {
      type: "tool_completed";
      tool: string;
    }
  | {
      type: "completed";
      result: unknown;
    };

export async function* streamInvestigation(
  message: string,
): AsyncGenerator<InvestigationEvent> {
  const userId = "demo-user";
  const sessionId = crypto.randomUUID();

  await runner.sessionService.createSession({
    appName: APP_NAME,
    userId,
    sessionId,
  });

  const events = runner.runAsync({
    userId,
    sessionId,
    newMessage: {
      role: "user",
      parts: [{ text: message }],
    },
  });

  let finalOutput = "";

  for await (const event of events) {
    for (const part of event.content?.parts ?? []) {
      if (part.functionCall?.name) {
        yield {
          type: "tool_started",
          tool: part.functionCall.name,
        };
      }

      if (part.functionResponse?.name) {
        yield {
          type: "tool_completed",
          tool: part.functionResponse.name,
        };
      }

      if (part.text) {
        finalOutput = part.text;
      }
    }
  }

  if (!finalOutput) {
    throw new Error("Agent returned no final output");
  }

  yield {
    type: "completed",
    result: JSON.parse(finalOutput),
  };
}
