# AI Engineering Investigator

An AI-powered incident-investigation API. It uses a Google ADK agent to correlate deployments, application metrics, logs, and recent commits, then streams a structured investigation result to the client.

## What it does

For a reported engineering problem, the agent gathers the available evidence and returns:

- a summary and probable cause;
- a confidence score from 0–100;
- the supporting evidence; and
- recommended next actions.

The deployment, metrics, and log tools currently use deterministic demo data for `orders-api`. The commit tools retrieve real commit metadata and diffs from the GitHub repository supplied with each request; set `GITHUB_TOKEN` to avoid unauthenticated API limits.

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

The API listens on `http://localhost:3001`. Set `FRONTEND_ORIGIN` to the URL of the frontend allowed to call the API; it defaults to `http://localhost:5173` for local development.

## API

### `POST /api/investigations/stream`

Starts an investigation and responds with a Server-Sent Events (SSE) stream.

Request body:

```json
{
  "repository": "owner/repository",
  "message": "Investigate the orders-api latency increase after the latest deployment."
}
```

Example request:

```bash
curl -N \
  -H 'Content-Type: application/json' \
  -X POST http://localhost:3001/api/investigations/stream \
  -d '{"repository":"https://github.com/owner/repository","message":"Investigate the orders-api latency increase after the latest deployment."}'
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

A request without a non-empty `message`, or with an invalid repository, returns `400`. Repositories must use `owner/repository` or `https://github.com/owner/repository` format.

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

## Docker

Build the image from the repository root:

```bash
docker build -t ai-engineering-investigator .
```

Then run it, supplying the required API key and optional GitHub token:

```bash
docker run --rm -p 3001:3001 \
  -e GOOGLE_API_KEY="$GOOGLE_API_KEY" \
  -e GITHUB_TOKEN="$GITHUB_TOKEN" \
  -e FRONTEND_ORIGIN="http://localhost:5173" \
  ai-engineering-investigator
```

`FRONTEND_ORIGIN` must be the plain URL, not a Markdown-formatted link.

## Google Cloud Run

Cloud Run supplies a `PORT` environment variable. The server listens on that port and on `0.0.0.0`; do not set `PORT` yourself in Cloud Run.

The commands below build the existing Dockerfile with Cloud Build, store runtime credentials in Secret Manager, and deploy a public Cloud Run service. Run them in Cloud Shell or a machine with the Google Cloud CLI authenticated to the target project.

```bash
export PROJECT_ID="your-google-cloud-project-id"
export REGION="europe-west1"
export SERVICE="ai-engineering-investigator"
export REPOSITORY="containers"
export FRONTEND_ORIGIN="https://mehmoodulhaq.vercel.app"

gcloud config set project "$PROJECT_ID"
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com

gcloud artifacts repositories create "$REPOSITORY" \
  --repository-format=docker \
  --location="$REGION"
```

Create a dedicated Cloud Run identity, then create the required API-key secret. These commands read the existing shell variables; they do not put secret values in source control.

```bash
export RUNTIME_SERVICE_ACCOUNT="investigator-runtime@$PROJECT_ID.iam.gserviceaccount.com"

gcloud iam service-accounts create investigator-runtime \
  --display-name="AI Engineering Investigator runtime"

printf %s "$GOOGLE_API_KEY" | gcloud secrets create investigator-google-api-key \
  --replication-policy=automatic \
  --data-file=-

gcloud secrets add-iam-policy-binding investigator-google-api-key \
  --member="serviceAccount:$RUNTIME_SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor"
```

Build and deploy the image. Pin secret versions in production; this example uses version `1`.

```bash
export IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/$SERVICE:latest"

gcloud builds submit --tag "$IMAGE"

gcloud run deploy "$SERVICE" \
  --image "$IMAGE" \
  --region "$REGION" \
  --allow-unauthenticated \
  --service-account="$RUNTIME_SERVICE_ACCOUNT" \
  --set-env-vars="FRONTEND_ORIGIN=$FRONTEND_ORIGIN" \
  --update-secrets="GOOGLE_API_KEY=investigator-google-api-key:1"
```

To add the optional GitHub token, create and authorize its secret, then update the service:

```bash
printf %s "$GITHUB_TOKEN" | gcloud secrets create investigator-github-token \
  --replication-policy=automatic \
  --data-file=-

gcloud secrets add-iam-policy-binding investigator-github-token \
  --member="serviceAccount:$RUNTIME_SERVICE_ACCOUNT" \
  --role="roles/secretmanager.secretAccessor"

gcloud run services update "$SERVICE" \
  --region="$REGION" \
  --update-secrets="GITHUB_TOKEN=investigator-github-token:1"
```

Copy the deployed URL for the portfolio:

```bash
gcloud run services describe "$SERVICE" \
  --region "$REGION" \
  --format='value(status.url)'
```

In the Vercel portfolio project, replace the local backend URL with that Cloud Run URL (for a Vite frontend, commonly `VITE_API_URL`) and redeploy Production. The deployed service is configured to allow requests from `https://mehmoodulhaq.vercel.app`. Never expose `GOOGLE_API_KEY` or `GITHUB_TOKEN` as Vercel client-side variables.

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
