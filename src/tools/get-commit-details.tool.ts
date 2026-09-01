import { FunctionTool } from "@google/adk";
import { z } from "zod";
import { latestDeploymentCommitSha } from "./get-deployments.tool.js";

type GitHubCommitDetails = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
  };
  files?: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    patch?: string;
  }>;
};

export const getCommitDetailsTool = new FunctionTool({
  name: "get_commit_details",

  description:
    "Gets the real GitHub details and diff for the deployment commit. The sha must be the exact SHA returned by get_deployments.",

  parameters: z.object({
    repository: z
      .string()
      .describe("GitHub repository in owner/repository format"),

    sha: z
      .literal(latestDeploymentCommitSha)
      .describe("Exact commit SHA returned by the latest deployment"),
  }),

  execute: async ({ repository, sha }) => {
    console.log("get_commit_details called:", { repository, sha });

    const response = await fetch(
      `https://api.github.com/repos/${repository}/commits/${sha}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "ai-engineering-investigator",

          ...(process.env.GITHUB_TOKEN
            ? {
                Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
              }
            : {}),
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `GitHub request failed: ${response.status} ${response.statusText}`,
      );
    }

    const commit = (await response.json()) as GitHubCommitDetails;

    return {
      sha: commit.sha,
      message: commit.commit.message,
      url: commit.html_url,

      files:
        commit.files?.map((file) => ({
          filename: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes,

          // GitHub provides the relevant diff when available
          patch: file.patch ?? null,
        })) ?? [],
    };
  },
});
