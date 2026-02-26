/**
 * Integration tests — hits real Exa MCP endpoint
 * Run with: npm run test:integration
 */

import { describe, it, expect } from "vitest";
import {
  webSearch,
  codeSearch,
  companyResearch,
  twitterSearch,
  peopleSearch,
  financialSearch,
} from "./exa-mcp-client";

const TIMEOUT = 30_000;

describe("integration: Exa MCP endpoint", () => {
  it("exa_web_search", async () => {
    const result = await webSearch({ query: "OpenAI latest news", numResults: 3 });
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(50);
    console.log("[web_search] ✅", result.slice(0, 200), "...");
  }, TIMEOUT);

  it("exa_code_search", async () => {
    const result = await codeSearch({ query: "React useState hook examples", tokensNum: 2000 });
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(50);
    console.log("[code_search] ✅", result.slice(0, 200), "...");
  }, TIMEOUT);

  it("exa_company_research", async () => {
    const result = await companyResearch({ companyName: "Anthropic", numResults: 3 });
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(50);
    console.log("[company_research] ✅", result.slice(0, 200), "...");
  }, TIMEOUT);

  it("exa_twitter_search", async () => {
    const result = await twitterSearch({ query: "AI agents", numResults: 5 });
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(50);
    console.log("[twitter_search] ✅", result.slice(0, 200), "...");
  }, TIMEOUT);

  it("exa_people_search", async () => {
    const result = await peopleSearch({ query: "CTO at Anthropic", numResults: 3 });
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(50);
    console.log("[people_search] ✅", result.slice(0, 200), "...");
  }, TIMEOUT);

  it("exa_financial_search", async () => {
    const result = await financialSearch({ query: "Apple 2024 annual report", numResults: 3 });
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(50);
    console.log("[financial_search] ✅", result.slice(0, 200), "...");
  }, TIMEOUT);
});
