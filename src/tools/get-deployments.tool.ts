import { FunctionTool } from "@google/adk";
import { z } from "zod";

const deployments = [
  {
    id: "dep-103",
    version: "v2.14.3",
    deployedAt: "2026-08-31T14:32:00Z",
    status: "success",
    commitSha: "a82fc1",
  },
  {
    id: "dep-102",
    version: "v2.14.2",
    deployedAt: "2026-08-29T10:15:00Z",
    status: "success",
    commitSha: "91bd20",
  },
];

export const getDeploymentsTool = new FunctionTool({
  name: "get_deployments",

  description:
    "Returns recent application deployments. Use this when investigating whether an incident is related to a deployment.",

  parameters: z.object({
    limit: z.number().int().min(1).max(10).default(5),
  }),

  execute: async ({ limit }) => {
    console.log("get_deployments called");

    return {
      deployments: deployments.slice(0, limit),
    };
  },
});
