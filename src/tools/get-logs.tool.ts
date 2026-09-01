import { FunctionTool } from "@google/adk";
import { z } from "zod";

const logs = [
  {
    timestamp: "2026-08-31T14:34:12Z",
    service: "orders-api",
    level: "error",
    message: "Database query timeout after 5000ms",
  },
  {
    timestamp: "2026-08-31T14:36:48Z",
    service: "orders-api",
    level: "warn",
    message: "Slow query detected in OrderRepository.findRecentOrders",
  },
  {
    timestamp: "2026-08-31T14:41:05Z",
    service: "orders-api",
    level: "error",
    message: "Database connection pool exhausted",
  },
];

export const getLogsTool = new FunctionTool({
  name: "get_logs",

  description:
    "Returns recent application logs for a service. Use this to investigate errors, warnings, timeouts, and other runtime issues.",

  parameters: z.object({
    service: z.string().describe("Service to inspect"),
    level: z.enum(["error", "warn", "info"]).optional(),
  }),

  execute: async ({ service, level }) => {
    console.log("get_logs called:", { service, level });

    const matchingLogs = logs.filter((log) => {
      if (log.service !== service) {
        return false;
      }

      if (level && log.level !== level) {
        return false;
      }

      return true;
    });

    return {
      service,
      logs: matchingLogs,
    };
  },
});
