/**
 * OpenClaw Exa Search Plugin
 *
 * Registers 6 tools: web_search, code_search, company_research,
 * twitter_search, people_search, financial_report_search
 */

import type { OpenClawPluginApi, AnyAgentTool } from "openclaw/plugin-sdk/plugin-entry";
import { type TSchema, Type } from "@sinclair/typebox";

import {
  webSearch,
  codeSearch,
  companyResearch,
  twitterSearch,
  peopleSearch,
  financialSearch,
} from "./exa-mcp-client.js";

// ─── Helper ────────────────────────────────────────────────────────

function wrapExecute(
  fn: (params: any) => Promise<string>,
): (id: string, params: Record<string, unknown>) => Promise<{
  content: Array<{ type: "text"; text: string }>;
  details: unknown;
}> {
  return async (_id, params) => {
    try {
      const result = await fn(params);
      return { content: [{ type: "text" as const, text: result }], details: {} };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text" as const, text: `Error: ${message}` }],
        details: { isError: true },
      };
    }
  };
}

// ─── Tool definitions ──────────────────────────────────────────────

const TOOLS: AnyAgentTool[] = [
  {
    name: "exa_web_search",
    label: "Exa Web Search",
    description:
      "Search the web using Exa AI neural search. Find current information, news, facts, or answer questions about any topic. Returns clean, formatted content ready for LLM use.",
    parameters: Type.Object({
      query: Type.String({ description: "Web search query" }),
      numResults: Type.Optional(
        Type.Number({ description: "Number of search results to return (default: 8)" }),
      ),
      type: Type.Optional(
        Type.Union(
          [Type.Literal("auto"), Type.Literal("fast"), Type.Literal("deep")],
          {
            description:
              "Search type - 'auto': balanced search (default), 'fast': quick results, 'deep': comprehensive research",
          },
        ),
      ),
      livecrawl: Type.Optional(
        Type.Union(
          [Type.Literal("fallback"), Type.Literal("preferred")],
          {
            description:
              "Live crawl mode - 'fallback': use live crawling as backup if cached unavailable, 'preferred': prioritize live crawling",
          },
        ),
      ),
    }),
    execute: wrapExecute(webSearch),
  },
  {
    name: "exa_code_search",
    label: "Exa Code Search",
    description:
      "Find code examples, documentation, and programming solutions from GitHub, Stack Overflow, and official docs. Useful for API usage, library examples, code snippets, and debugging help.",
    parameters: Type.Object({
      query: Type.String({
        description:
          "Search query for code context - e.g., 'React useState hook examples', 'Python pandas dataframe filtering'",
      }),
      tokensNum: Type.Optional(
        Type.Number({
          description:
            "Number of tokens to return (1000-50000). Lower for focused queries, higher for comprehensive docs (default: 5000)",
        }),
      ),
    }),
    execute: wrapExecute(codeSearch),
  },
  {
    name: "exa_company_research",
    label: "Exa Company Research",
    description:
      "Research any company to get business information, news, and insights. Returns information from trusted business sources about products, services, recent news, or industry position.",
    parameters: Type.Object({
      companyName: Type.String({
        description: "Name of the company to research",
      }),
      numResults: Type.Optional(
        Type.Number({
          description: "Number of search results to return (default: 5)",
        }),
      ),
    }),
    execute: wrapExecute(companyResearch),
  },
  {
    name: "exa_twitter_search",
    label: "Exa Twitter Search",
    description:
      "Search Twitter/X posts. Find tweets, discussions, and social commentary on any topic. Useful for tracking public sentiment, announcements, and trending discussions.",
    parameters: Type.Object({
      query: Type.String({
        description: "Search query for Twitter/X posts",
      }),
      numResults: Type.Optional(
        Type.Number({
          description: "Number of tweets to return (default: 10)",
        }),
      ),
      startPublishedDate: Type.Optional(
        Type.String({
          description:
            "Filter tweets published after this date (ISO 8601 format, e.g., '2024-01-01T00:00:00.000Z')",
        }),
      ),
      endPublishedDate: Type.Optional(
        Type.String({
          description:
            "Filter tweets published before this date (ISO 8601 format)",
        }),
      ),
    }),
    execute: wrapExecute(twitterSearch),
  },
  {
    name: "exa_people_search",
    label: "Exa People Search",
    description:
      "Find people and their professional profiles. Search for individuals by name, role, company, or expertise. Returns public LinkedIn and professional profile data.",
    parameters: Type.Object({
      query: Type.String({
        description:
          "Search query for people - e.g., 'CTO at Anthropic', 'machine learning researchers Stanford'",
      }),
      numResults: Type.Optional(
        Type.Number({
          description: "Number of results to return (default: 5)",
        }),
      ),
    }),
    execute: wrapExecute(peopleSearch),
  },
  {
    name: "exa_financial_report_search",
    label: "Exa Financial Report Search",
    description:
      "Search financial reports — 10-K, 10-Q, annual reports, quarterly earnings, and SEC filings for public companies.",
    parameters: Type.Object({
      query: Type.String({
        description:
          "Search query for financial reports - e.g., 'Apple 2024 Q4 earnings', 'Tesla annual report 2024'",
      }),
      numResults: Type.Optional(
        Type.Number({
          description: "Number of results to return (default: 10)",
        }),
      ),
      startPublishedDate: Type.Optional(
        Type.String({
          description:
            "Filter reports published after this date (ISO 8601 format)",
        }),
      ),
      endPublishedDate: Type.Optional(
        Type.String({
          description:
            "Filter reports published before this date (ISO 8601 format)",
        }),
      ),
    }),
    execute: wrapExecute(financialSearch),
  },
];

// ─── Plugin entry ──────────────────────────────────────────────────

export default {
  id: "openclaw-exa-search",
  name: "Exa Search",
  description:
    "Exa AI search integration for OpenClaw — web, code, company, Twitter/X, people, and financial report search. No API key required.",
  register(api: OpenClawPluginApi) {
    for (const tool of TOOLS) {
      api.registerTool(tool);
    }
  },
};

export { TOOLS };
