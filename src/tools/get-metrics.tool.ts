import { FunctionTool } from "@google/adk";
import { z } from "zod";

const metrics = [
  {
    timestamp: "2026-08-31T14:25:00Z",
    service: "orders-api",
    avgLatencyMs: 180,
    errorRate: 0.8,
    requestsPerMinute: 4200,
  },
  {
    timestamp: "2026-08-31T14:35:00Z",
    service: "orders-api",
    avgLatencyMs: 255,
    errorRate: 1.1,
    requestsPerMinute: 4300,
  },
  {
    timestamp: "2026-08-31T14:45:00Z",
    service: "orders-api",
    avgLatencyMs: 310,
    errorRate: 1.4,
    requestsPerMinute: 4250,
  },
];

export const getMetricsTool = new FunctionTool({
  name: "get_metrics",

  description:
    "Returns application metrics such as latency, error rate, and request volume for a service.",

  parameters: z.object({
    service: z.string().describe("Service to inspect"),
  }),

  execute: async ({ service }) => {
    console.log("get_metrics called:", service);

    return {
      service,
      metrics: metrics.filter((metric) => metric.service === service),
    };
  },
});
