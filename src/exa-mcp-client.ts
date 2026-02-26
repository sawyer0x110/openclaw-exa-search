/**
 * Exa MCP Client — HTTP/SSE communication with Exa hosted MCP endpoint
 * No API key required; uses mcp.exa.ai with all tools enabled
 */

const EXA_BASE_URL = "https://mcp.exa.ai/mcp";

const EXA_TOOLS = [
  "web_search_exa",
  "web_search_advanced_exa",
  "get_code_context_exa",
  "company_research_exa",
  "people_search_exa",
].join(",");

const EXA_URL = `${EXA_BASE_URL}?tools=${EXA_TOOLS}`;

const REQUEST_TIMEOUT_MS = 30_000;

let requestIdCounter = 0;

interface ExaRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

interface ExaSuccessResponse {
  jsonrpc: "2.0";
  id: number;
  result: {
    content?: Array<{ type: string; text: string }>;
    tools?: Array<{ name: string; description: string; inputSchema: unknown }>;
  };
}

interface ExaErrorResponse {
  jsonrpc: "2.0";
  id: number;
  error: {
    code: number;
    message: string;
  };
}

type ExaResponse = ExaSuccessResponse | ExaErrorResponse;

/**
 * Parse SSE response — extract the last complete JSON-RPC message.
 * Per SSE spec, multiple `data:` lines within one event are joined with "\n",
 * but Exa sends one JSON object per `data:` line. We take the last `data:` line
 * that parses as valid JSON to handle both single and multi-event streams.
 */
export function parseSSEResponse(text: string): string {
  const lines = text.split("\n");
  const dataLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      dataLines.push(line.substring(6));
    }
  }
  if (dataLines.length === 0) {
    throw new Error("No data: field found in SSE response");
  }
  // Try each data line from last to first — return the first valid JSON
  for (let i = dataLines.length - 1; i >= 0; i--) {
    try {
      JSON.parse(dataLines[i]);
      return dataLines[i];
    } catch {
      // not valid JSON, try next
    }
  }
  // Fallback: join all and let caller handle parse error
  return dataLines.join("");
}

/**
 * Call an Exa MCP tool
 */
export async function callExa(
  method: string,
  params?: Record<string, unknown>,
  fetchFn: typeof fetch = fetch
): Promise<ExaResponse> {
  const requestId = ++requestIdCounter;

  const request: ExaRequest = {
    jsonrpc: "2.0",
    id: requestId,
    method,
    params,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetchFn(EXA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();

    // Try JSON first, fallback to SSE parsing
    try {
      return JSON.parse(text) as ExaResponse;
    } catch {
      const jsonData = parseSSEResponse(text);
      return JSON.parse(jsonData) as ExaResponse;
    }
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`Exa request timed out after ${REQUEST_TIMEOUT_MS / 1000}s`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Extract text content from an Exa response
 */
export function extractTextContent(response: ExaResponse): string {
  if ("error" in response) {
    throw new Error(
      `Exa API error: ${response.error.code} - ${response.error.message}`
    );
  }

  const result = (response as ExaSuccessResponse).result;
  if (!result?.content) {
    throw new Error("No content in response");
  }

  return result.content
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n\n");
}

// ─── Tool Functions ────────────────────────────────────────────────

export async function webSearch(params: {
  query: string;
  numResults?: number;
  type?: "auto" | "fast" | "deep";
  livecrawl?: "fallback" | "preferred";
}): Promise<string> {
  const response = await callExa("tools/call", {
    name: "web_search_exa",
    arguments: params,
  });
  return extractTextContent(response);
}

export async function codeSearch(params: {
  query: string;
  tokensNum?: number;
}): Promise<string> {
  const response = await callExa("tools/call", {
    name: "get_code_context_exa",
    arguments: params,
  });
  return extractTextContent(response);
}

export async function companyResearch(params: {
  companyName: string;
  numResults?: number;
}): Promise<string> {
  const response = await callExa("tools/call", {
    name: "company_research_exa",
    arguments: params,
  });
  return extractTextContent(response);
}

export async function twitterSearch(params: {
  query: string;
  numResults?: number;
  startPublishedDate?: string;
  endPublishedDate?: string;
}): Promise<string> {
  const args: Record<string, unknown> = {
    query: params.query,
    category: "tweet",
    numResults: params.numResults ?? 10,
  };
  if (params.startPublishedDate !== undefined) args.startPublishedDate = params.startPublishedDate;
  if (params.endPublishedDate !== undefined) args.endPublishedDate = params.endPublishedDate;

  const response = await callExa("tools/call", {
    name: "web_search_advanced_exa",
    arguments: args,
  });
  return extractTextContent(response);
}

export async function peopleSearch(params: {
  query: string;
  numResults?: number;
}): Promise<string> {
  const response = await callExa("tools/call", {
    name: "people_search_exa",
    arguments: params,
  });
  return extractTextContent(response);
}

export async function financialSearch(params: {
  query: string;
  numResults?: number;
  startPublishedDate?: string;
  endPublishedDate?: string;
}): Promise<string> {
  const args: Record<string, unknown> = {
    query: params.query,
    category: "financial report",
    numResults: params.numResults ?? 10,
  };
  if (params.startPublishedDate !== undefined) args.startPublishedDate = params.startPublishedDate;
  if (params.endPublishedDate !== undefined) args.endPublishedDate = params.endPublishedDate;

  const response = await callExa("tools/call", {
    name: "web_search_advanced_exa",
    arguments: args,
  });
  return extractTextContent(response);
}
