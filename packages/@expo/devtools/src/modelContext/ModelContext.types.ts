/**
 * Content item returned by a tool. Mirrors the MCP `CallToolResult.content` items.
 */
export type ModelContextToolContent =
  | { type: 'text'; text: string }
  | { type: 'image'; data: string; mimeType: string };

/**
 * Result returned by a tool's `execute` function. Mirrors the MCP `CallToolResult`.
 */
export interface ModelContextToolResult {
  content: ModelContextToolContent[];
  isError?: boolean;
}

/**
 * A tool that the running app exposes to an agent. The shape follows the WebMCP
 * `document.modelContext.registerTool()` descriptor.
 */
export interface ModelContextTool<Input extends Record<string, unknown> = Record<string, unknown>> {
  /** Unique tool name. Allowed characters: `a-z`, `A-Z`, `0-9`, `_`, `-`. Max 64 characters. */
  name: string;
  /** What the tool does. Shown to the agent. Max 1024 characters. */
  description: string;
  /** JSON Schema for `execute` input. Must be `{ "type": "object", ... }`. */
  inputSchema: Record<string, unknown>;
  /** Runs when the agent calls the tool. `signal` aborts when the call times out. */
  execute(
    input: Input,
    options: { signal: AbortSignal }
  ): ModelContextToolResult | Promise<ModelContextToolResult>;
}

export interface RegisterToolOptions {
  /** Abort this signal to unregister the tool. */
  signal?: AbortSignal;
  /**
   * Stack trace captured at the call site. Used by the dev server to attribute the tool to the
   * app or to a package. `useModelContextTool` sets this. Do not set it yourself.
   * @hidden
   */
  stack?: string;
}

export interface ModelContextToolSubscription {
  /** Unregister the tool. */
  remove(): void;
}

export interface ModelContext {
  /**
   * Register a tool with the Expo dev server so an agent can call it.
   * Only active in development. In production this is a no-op.
   */
  registerTool(
    tool: ModelContextTool<any>,
    options?: RegisterToolOptions
  ): ModelContextToolSubscription;
  /** Unregister a tool by name. */
  unregisterTool(name: string): void;
  /** List tools registered by this app runtime. */
  getTools(): ModelContextTool<any>[];
}
