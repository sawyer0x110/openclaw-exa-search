/**
 * Ambient type declarations for openclaw plugin SDK.
 *
 * At runtime, openclaw loads this plugin in-process and provides the SDK.
 * For CI / standalone typecheck, these declarations satisfy the compiler.
 */
declare module "openclaw/plugin-sdk/plugin-entry" {
  /** Subset of the OpenClaw plugin API used by this plugin. */
  export interface OpenClawPluginApi {
    registerTool: (tool: AnyAgentTool, opts?: Record<string, unknown>) => void;
    runtime?: { version?: string };
  }

  /** Minimal AgentTool shape matching @mariozechner/pi-agent-core. */
  export interface AnyAgentTool {
    name: string;
    label: string;
    description: string;
    parameters: unknown;
    execute: (
      toolCallId: string,
      params: any,
      signal?: AbortSignal,
    ) => Promise<{ content: Array<{ type: string; text: string }>; details: unknown }>;
  }
}
