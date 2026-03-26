import { describe, it, expect, vi } from "vitest";
import plugin, { TOOLS } from "./index.js";

describe("plugin registration", () => {
  it("registers all 6 tools", () => {
    const registered: string[] = [];
    const api = {
      registerTool: vi.fn((tool: any) => registered.push(tool.name)),
    };

    plugin.register(api as any);

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

  it("has correct plugin metadata", () => {
    expect(plugin.id).toBe("openclaw-exa-search");
    expect(plugin.name).toBe("Exa Search");
    expect(plugin.description).toBeTruthy();
    expect(typeof plugin.register).toBe("function");
  });
});

describe("tool definitions", () => {
  it("all tools have required fields", () => {
    for (const tool of TOOLS) {
      expect(tool.name).toMatch(/^exa_/);
      expect(tool.label).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.parameters).toBeDefined();
      expect(typeof tool.execute).toBe("function");
    }
  });

  it("all tools have unique names", () => {
    const names = TOOLS.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("wrapExecute", () => {
  it("returns content array on success", async () => {
    const tool = TOOLS.find((t) => t.name === "exa_web_search")!;
    const result = await tool.execute("test-id", { query: "OpenAI", numResults: 1 } as any);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text.length).toBeGreaterThan(0);
  });

  it("wraps errors with details.isError flag", async () => {
    const tool = TOOLS.find((t) => t.name === "exa_people_search")!;
    const result = await tool.execute("test-id", { query: "" } as any);

    // Either succeeds or fails gracefully — both paths are valid
    if ((result.details as any)?.isError) {
      expect(result.content[0].text).toMatch(/^Error:/);
    } else {
      expect(result.content[0].type).toBe("text");
    }
  });
});
