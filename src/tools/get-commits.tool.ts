import { FunctionTool } from "@google/adk";
import { z } from "zod";

const commits = [
  {
    sha: "a82fc1",
    timestamp: "2026-08-31T13:58:00Z",
    service: "orders-api",
    author: "dev@example.com",
    message: "Refactor recent orders query",
    files: ["src/orders/order.repository.ts", "src/orders/order.service.ts"],
  },
  {
    sha: "91bd20",
    timestamp: "2026-08-29T09:40:00Z",
    service: "orders-api",
    author: "dev@example.com",
    message: "Add pagination metadata",
    files: ["src/orders/order.controller.ts"],
  },
];

export const getCommitsTool = new FunctionTool({
  name: "get_commits",

  description:
    "Returns recent code commits for a service. Use this to identify code changes that may explain an incident.",

  parameters: z.object({
    service: z.string().describe("Service to inspect"),
    limit: z.number().int().min(1).max(10).default(5),
  }),

  execute: async ({ service, limit }) => {
    console.log("get_commits called:", { service, limit });

    return {
      service,
      commits: commits
        .filter((commit) => commit.service === service)
        .slice(0, limit),
    };
  },
});
