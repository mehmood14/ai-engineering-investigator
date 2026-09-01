import { z } from "zod";

export const investigationResultSchema = z.object({
  summary: z.string(),

  probableCause: z.string(),

  confidence: z
    .number()
    .min(0)
    .max(100)
    .describe("Confidence percentage from 0 to 100"),

  evidence: z.array(z.string()),

  recommendations: z.array(z.string()),
});

export type InvestigationResult = z.infer<typeof investigationResultSchema>;
