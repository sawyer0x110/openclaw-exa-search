/**
 * OpenClaw Exa Search Plugin
 *
 * Registers 6 tools: web_search, code_search, company_research,
 * twitter_search, people_search, financial_report_search
 */

import {
  webSearch,
  codeSearch,
  companyResearch,
  twitterSearch,
  peopleSearch,
  financialSearch,
} from "./exa-mcp-client";

interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (id: string, params: Record<string, unknown>) => Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }>;
}

interface PluginAPI {
  registerTool: (tool: ToolDefinition) => void;
}

function wrapExecute(
  fn: (params: any) => Promise<string>
): ToolDefinition["execute"] {
  return async (_id: string, params: Record<string, unknown>) => {
    try {
      const result = await fn(params);
      return { content: [{ type: "text", text: result }] };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      };
    }
  };
}

const TOOLS: ToolDefinition[] = [
  {
    name: "exa_web_search",
    description:
      "Search the web using Exa AI neural search. Find current information, news, facts, or answer questions about any topic. Returns clean, formatted content ready for LLM use.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Web search query" },
        numResults: {
          type: "number",
          description: "Number of search results to return (default: 8)",
        },
        type: {
          type: "string",
          enum: ["auto", "fast", "deep"],
          description:
            "Search type - 'auto': balanced search (default), 'fast': quick results, 'deep': comprehensive research",
        },
        livecrawl: {
          type: "string",
          enum: ["fallback", "preferred"],
          description:
            "Live crawl mode - 'fallback': use live crawling as backup if cached unavailable, 'preferred': prioritize live crawling",
        },
      },
      required: ["query"],
    },
    execute: wrapExecute(webSearch),
  },
  {
    name: "exa_code_search",
    description:
      "Find code examples, documentation, and programming solutions from GitHub, Stack Overflow, and official docs. Useful for API usage, library examples, code snippets, and debugging help.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Search query for code context - e.g., 'React useState hook examples', 'Python pandas dataframe filtering'",
        },
        tokensNum: {
          type: "number",
          description:
            "Number of tokens to return (1000-50000). Lower for focused queries, higher for comprehensive docs (default: 5000)",
        },
      },
      required: ["query"],
    },
    execute: wrapExecute(codeSearch),
  },
  {
    name: "exa_company_research",
    description:
      "Research any company to get business information, news, and insights. Returns information from trusted business sources about products, services, recent news, or industry position.",
    parameters: {
      type: "object",
      properties: {
        companyName: {
          type: "string",
          description: "Name of the company to research",
        },
        numResults: {
          type: "number",
          description: "Number of search results to return (default: 5)",
        },
      },
      required: ["companyName"],
    },
    execute: wrapExecute(companyResearch),
  },
  {
    name: "exa_twitter_search",
    description:
      "Search Twitter/X posts. Find tweets, discussions, and social commentary on any topic. Useful for tracking public sentiment, announcements, and trending discussions.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query for Twitter/X posts",
        },
        numResults: {
          type: "number",
          description: "Number of tweets to return (default: 10)",
        },
        startPublishedDate: {
          type: "string",
          description:
            "Filter tweets published after this date (ISO 8601 format, e.g., '2024-01-01T00:00:00.000Z')",
        },
        endPublishedDate: {
          type: "string",
          description:
            "Filter tweets published before this date (ISO 8601 format)",
        },
      },
      required: ["query"],
    },
    execute: wrapExecute(twitterSearch),
  },
  {
    name: "exa_people_search",
    description:
      "Find people and their professional profiles. Search for individuals by name, role, company, or expertise. Returns public LinkedIn and professional profile data.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Search query for people - e.g., 'CTO at Anthropic', 'machine learning researchers Stanford'",
        },
        numResults: {
          type: "number",
          description: "Number of results to return (default: 5)",
        },
      },
      required: ["query"],
    },
    execute: wrapExecute(peopleSearch),
  },
  {
    name: "exa_financial_report_search",
    description:
      "Search financial reports — 10-K, 10-Q, annual reports, quarterly earnings, and SEC filings for public companies.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Search query for financial reports - e.g., 'Apple 2024 Q4 earnings', 'Tesla annual report 2024'",
        },
        numResults: {
          type: "number",
          description: "Number of results to return (default: 10)",
        },
        startPublishedDate: {
          type: "string",
          description:
            "Filter reports published after this date (ISO 8601 format)",
        },
        endPublishedDate: {
          type: "string",
          description:
            "Filter reports published before this date (ISO 8601 format)",
        },
      },
      required: ["query"],
    },
    execute: wrapExecute(financialSearch),
  },
];

export default function (api: PluginAPI) {
  for (const tool of TOOLS) {
    api.registerTool(tool);
  }
}

export { TOOLS };
