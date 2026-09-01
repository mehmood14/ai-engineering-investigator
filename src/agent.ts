import "dotenv/config";
import { LlmAgent } from "@google/adk";
import { investigationResultSchema } from "./schemas/investigation-result.schema.js";
import { getCommitsTool } from "./tools/get-commits.tool.js";
import { getDeploymentsTool } from "./tools/get-deployments.tool.js";
import { getLogsTool } from "./tools/get-logs.tool.js";
import { getMetricsTool } from "./tools/get-metrics.tool.js";

export const rootAgent = new LlmAgent({
  name: "incident_investigator",
  model: "gemini-3.5-flash-lite",

  description:
    "Investigates software engineering incidents using available evidence and tools.",

  instruction: `
    You are an AI engineering incident investigator.

    Investigate engineering problems using the tools available to you.

    Rules:
    - Use tools when evidence is required.
    - Correlate deployments, metrics, logs, and code changes.
    - Do not invent evidence.
    - Clearly separate correlation from causation.
    - Prefer evidence closest in time to the incident.
    - If evidence is insufficient, say so.
    - Confidence must reflect the strength of the evidence.
  `,
  tools: [getDeploymentsTool, getMetricsTool, getLogsTool, getCommitsTool],
  outputSchema: investigationResultSchema,
});
