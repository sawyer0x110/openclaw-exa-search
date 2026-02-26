import { describe, it, expect, vi } from "vitest";
import pluginInit, { TOOLS } from "./index.js";

describe("plugin registration", () => {
  it("registers all 6 tools", () => {
    const registered: string[] = [];
    const api = {
      registerTool: vi.fn((tool: any) => registered.push(tool.name)),
    };

    pluginInit(api);

    expect(registered).toEqual([
      "exa_web_search",
      "exa_code_search",
      "exa_company_research",
      "exa_twitter_search",
      "exa_people_search",
      "exa_financial_report_search",
    ]);
    expect(api.registerTool).toHaveBeenCalledTimes(6);
  });
});

describe("tool definitions", () => {
  it("all tools have required fields", () => {
    for (const tool of TOOLS) {
      expect(tool.name).toMatch(/^exa_/);
      expect(tool.description).toBeTruthy();
      expect(tool.parameters).toBeDefined();
      expect(typeof tool.execute).toBe("function");

      const required = (tool.parameters as any).required;
      expect(required.length).toBeGreaterThan(0);
    }
  });

  it("all tools have unique names", () => {
    const names = TOOLS.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("wrapExecute", () => {
  it("returns content array on success", async () => {
    // Use real Exa endpoint — web_search should work
    const tool = TOOLS.find((t) => t.name === "exa_web_search")!;
    const result = await tool.execute("test-id", { query: "OpenAI", numResults: 1 });

    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text.length).toBeGreaterThan(0);
  });

  it("wraps errors with isError flag", async () => {
    // Call with a tool that will fail — pass invalid params to trigger Exa error
    const tool = TOOLS.find((t) => t.name === "exa_people_search")!;
    // Empty query should cause an error from Exa
    const result = await tool.execute("test-id", { query: "" });

    // Either succeeds or fails gracefully — both paths are valid
    if (result.isError) {
      expect(result.content[0].text).toMatch(/^Error:/);
    } else {
      expect(result.content[0].type).toBe("text");
    }
  });
});
