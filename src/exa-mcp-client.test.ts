import { describe, it, expect, vi } from "vitest";
import { parseSSEResponse, extractTextContent, callExa } from "./exa-mcp-client.js";

describe("parseSSEResponse", () => {
  it("extracts data from SSE format", () => {
    const sse = 'event: message\ndata: {"jsonrpc":"2.0","id":1,"result":{}}\n\n';
    expect(parseSSEResponse(sse)).toBe('{"jsonrpc":"2.0","id":1,"result":{}}');
  });

  it("throws when no data field", () => {
    expect(() => parseSSEResponse("event: message\n")).toThrow(
      "No data: field found"
    );
  });

  it("returns last valid JSON data line from multi-line SSE", () => {
    const sse =
      'data: {"jsonrpc":"2.0","id":1,"result":{"content":[]}}\ndata: {"jsonrpc":"2.0","id":1,"result":{"content":[{"type":"text","text":"final"}]}}\n';
    const result = parseSSEResponse(sse);
    expect(JSON.parse(result).result.content[0].text).toBe("final");
  });

  it("falls back to concatenation when no line is valid JSON", () => {
    const sse = "data: not-json-a\ndata: not-json-b\n";
    expect(parseSSEResponse(sse)).toBe("not-json-anot-json-b");
  });
});

describe("extractTextContent", () => {
  it("extracts text from valid response", () => {
    const response = {
      jsonrpc: "2.0" as const,
      id: 1,
      result: {
        content: [
          { type: "text", text: "Hello" },
          { type: "text", text: "World" },
        ],
      },
    };
    expect(extractTextContent(response)).toBe("Hello\n\nWorld");
  });

  it("throws on API error", () => {
    const response = {
      jsonrpc: "2.0" as const,
      id: 1,
      error: { code: 400, message: "Bad request" },
    };
    expect(() => extractTextContent(response)).toThrow("Exa API error: 400");
  });

  it("throws on missing content", () => {
    const response = {
      jsonrpc: "2.0" as const,
      id: 1,
      result: {},
    };
    expect(() => extractTextContent(response)).toThrow("No content");
  });

  it("filters non-text content types", () => {
    const response = {
      jsonrpc: "2.0" as const,
      id: 1,
      result: {
        content: [
          { type: "image", text: "ignored" },
          { type: "text", text: "kept" },
        ],
      },
    };
    expect(extractTextContent(response)).toBe("kept");
  });
});

describe("callExa", () => {
  function mockFetch(body: unknown, status = 200): typeof fetch {
    return vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? "OK" : "Bad Request",
      text: () => Promise.resolve(typeof body === "string" ? body : JSON.stringify(body)),
    });
  }

  it("sends correct JSON-RPC request and parses JSON response", async () => {
    const responseBody = {
      jsonrpc: "2.0",
      id: 1,
      result: { content: [{ type: "text", text: "ok" }] },
    };
    const fetchFn = mockFetch(responseBody);

    const result = await callExa("tools/call", { name: "web_search_exa", arguments: { query: "test" } }, fetchFn);

    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, opts] = (fetchFn as any).mock.calls[0];
    expect(url).toContain("mcp.exa.ai");
    expect(opts.method).toBe("POST");
    expect(opts.headers["Content-Type"]).toBe("application/json");

    const body = JSON.parse(opts.body);
    expect(body.jsonrpc).toBe("2.0");
    expect(body.method).toBe("tools/call");
    expect(body.params.name).toBe("web_search_exa");

    expect((result as any).result.content[0].text).toBe("ok");
  });

  it("falls back to SSE parsing when response is not JSON", async () => {
    const sseBody = 'event: message\ndata: {"jsonrpc":"2.0","id":1,"result":{"content":[{"type":"text","text":"sse"}]}}\n\n';
    const fetchFn = mockFetch(sseBody);

    const result = await callExa("tools/call", { name: "web_search_exa", arguments: {} }, fetchFn);
    expect((result as any).result.content[0].text).toBe("sse");
  });

  it("throws on HTTP error", async () => {
    const fetchFn = mockFetch("Bad Request", 400);
    await expect(callExa("tools/call", {}, fetchFn)).rejects.toThrow("HTTP error: 400");
  });

  it("throws descriptive timeout error on abort", async () => {
    const fetchFn = vi.fn().mockImplementation(() => {
      const err = new DOMException("The operation was aborted", "AbortError");
      return Promise.reject(err);
    });

    await expect(callExa("tools/call", {}, fetchFn)).rejects.toThrow("timed out");
  });
});
