import { FunctionTool } from "@google/adk";
import { z } from "zod";

type GitHubCommit = {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    } | null;
  };
};

export const getCommitsTool = new FunctionTool({
  name: "get_commits",

  description:
    "Gets recent commits from a GitHub repository. Use this to inspect recent code changes.",

  parameters: z.object({
    repository: z
      .string()
      .describe("GitHub repository in owner/repository format"),

    limit: z.number().int().min(1).max(10).default(5),
  }),

  execute: async ({ repository, limit }) => {
    console.log("get_commits called:", repository);

    const response = await fetch(
      `https://api.github.com/repos/${repository}/commits?per_page=${limit}`,
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

    const commits = (await response.json()) as GitHubCommit[];

    return {
      repository,

      commits: commits.map((commit) => ({
        sha: commit.sha,
        shortSha: commit.sha.slice(0, 7),
        message: commit.commit.message,
        author: commit.commit.author?.name ?? "Unknown",
        timestamp: commit.commit.author?.date ?? null,
        url: commit.html_url,
      })),
    };
  },
});
