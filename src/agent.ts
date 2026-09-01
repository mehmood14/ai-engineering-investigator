import "dotenv/config";
import { LlmAgent } from "@google/adk";
import { investigationResultSchema } from "./schemas/investigation-result.schema.js";
import { getCommitsTool } from "./tools/get-commits.tool.js";
import {
  getDeploymentsTool,
  latestDeploymentCommitSha,
} from "./tools/get-deployments.tool.js";
import { getLogsTool } from "./tools/get-logs.tool.js";
import { getMetricsTool } from "./tools/get-metrics.tool.js";
import { getCommitDetailsTool } from "./tools/get-commit-details.tool.js";

export const rootAgent = new LlmAgent({
  name: "incident_investigator",
  model: "gemini-3.5-flash-lite",

  description:
    "Investigates software engineering incidents using available evidence and tools.",

  instruction: `
    You are an AI engineering incident investigator.

    Demo environment:
    - Application service: orders-api
    - GitHub repository: mehmood14/ai-engineering-investigator

    Evidence rules:
    - If no service is specified, use orders-api.
    - Use orders-api when querying metrics and logs.
    - Use mehmood14/ai-engineering-investigator when querying GitHub.
    - Never pass a service name as a GitHub repository.
    - Treat deployments, metrics, logs, and GitHub code changes as separate evidence sources.
    - Never invent repository names, service names, commit SHAs, deployments, logs, metrics, file changes, commit contents, patches, or database changes.
    - Use the tools to gather evidence; do not rely on assumptions.
    - Call each tool at most once unless there is a clear reason to retry.
    - If a tool returns no data, report that instead of retrying with invented parameters.
    - A deployment that precedes telemetry changes is temporal correlation, not causation.
    - Claim a code change caused an incident only when the real GitHub diff directly supports that conclusion.
    - If the GitHub diff does not support the telemetry hypothesis, explicitly say so and do not attribute the incident to the deployment.
    - If evidence sources do not agree, lower confidence and state the disagreement.

    Investigation workflow:
    1. Call get_deployments, get_metrics, get_logs, and get_commits.
    2. The latest deployment SHA is ${latestDeploymentCommitSha}. Call get_commit_details with that exact SHA.
    3. Inspect the returned changed files and patches before evaluating a code-change hypothesis.
    4. In evidence, include relevant real GitHub changed files or diff findings when get_commit_details returns them. If it returns no files or no supporting diff, say that.
    5. Keep probableCause conservative when the code diff does not support the telemetry hypothesis. Explain the supported telemetry observation and the lack of code-diff support.
    6. Set confidence according to agreement across evidence sources; reduce it when deployment timing, telemetry, logs, and the GitHub diff do not agree.
  `,
  tools: [
    getDeploymentsTool,
    getMetricsTool,
    getLogsTool,
    getCommitsTool,
    getCommitDetailsTool,
  ],
  outputSchema: investigationResultSchema,
});
