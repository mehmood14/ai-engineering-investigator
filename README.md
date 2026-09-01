# AI Engineering Investigator

An AI-powered incident-investigation API. It uses a Google ADK agent to correlate deployments, application metrics, logs, and recent commits, then streams a structured investigation result to the client.

## What it does

For a reported engineering problem, the agent gathers the available evidence and returns:

- a summary and probable cause;
- a confidence score from 0–100;
- the supporting evidence; and
- recommended next actions.

The deployment, metrics, and log tools currently use deterministic demo data for `orders-api`. The commit tools retrieve real commit metadata and diffs from GitHub for `mehmood14/ai-engineering-investigator`; set `GITHUB_TOKEN` to avoid unauthenticated API limits.

## Prerequisites

- Node.js 22 or later
- A Gemini Developer API key, supplied as `GOOGLE_API_KEY`

## Get started

Install dependencies and create a local environment file:

```bash
npm install
printf 'GOOGLE_API_KEY=your_api_key_here\n' > .env
```

Start the development server:

```bash
npm run dev
```

The API listens on `http://localhost:3001`. CORS is configured for a frontend running at `http://localhost:5173`.

## API

### `POST /api/investigations/stream`

Starts an investigation and responds with a Server-Sent Events (SSE) stream.

Request body:

```json
{
  "message": "Investigate the orders-api latency increase after the latest deployment."
}
```

Example request:

```bash
curl -N \
  -H 'Content-Type: application/json' \
  -X POST http://localhost:3001/api/investigations/stream \
  -d '{"message":"Investigate the orders-api latency increase after the latest deployment."}'
```

Each SSE `data` payload is JSON and has one of these shapes:

```ts
{ type: 'tool_started'; tool: string }
{ type: 'tool_completed'; tool: string }
{ type: 'completed'; result: InvestigationResult }
{ type: 'error'; message: string }
```

`InvestigationResult` is:

```ts
{
  summary: string;
  probableCause: string;
  confidence: number; // 0–100
  evidence: string[];
  recommendations: string[];
}
```

A request without a non-empty `message` returns `400` with `{ "error": "message is required" }`.

## Available evidence tools

| Tool | Purpose |
| --- | --- |
| `get_deployments` | Finds recent deployments and their commit SHA. |
| `get_metrics` | Returns latency, error rate, and request volume for a service. |
| `get_logs` | Retrieves service logs, optionally filtered by level. |
| `get_commits` | Retrieves recent commits from GitHub. |
| `get_commit_details` | Retrieves changed files and patches for the deployed GitHub commit. |

The agent is instructed to use evidence where needed, distinguish correlation from causation, prefer evidence close to the incident, and state when evidence is insufficient.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Run the Fastify server with file watching. |
| `npm run build` | Type-check and compile TypeScript into `dist/`. |
| `npm start` | Run the compiled server. |
| `npm run agent` | Launch the ADK agent directly. |

For a production build, run:

```bash
npm run build
npm start
```

## Project structure

```text
src/
├── agent.ts                       # ADK agent definition and instructions
├── server.ts                      # Fastify SSE endpoint
├── services/agent.service.ts      # Agent execution and stream translation
├── schemas/                       # Structured investigation result schema
└── tools/                         # Evidence-provider tools (demo data)
```

## Extending the project

Replace the arrays in `src/tools/` with integrations for your deployment platform, metrics provider, log store, and Git host. Keep tool outputs factual and timestamped so the agent can make evidence-based correlations without inventing details.
