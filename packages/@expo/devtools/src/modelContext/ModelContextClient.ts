import { WebSocketWithReconnect } from '../WebSocketWithReconnect';
import type { ConnectionInfo } from '../devtools.types';
import * as logger from '../logger';
import type {
  ModelContext,
  ModelContextTool,
  ModelContextToolResult,
  ModelContextToolSubscription,
  RegisterToolOptions,
} from './ModelContext.types';

export const MODEL_CONTEXT_PROTOCOL_VERSION = 1;
export const MODEL_CONTEXT_ENDPOINT = '/_expo/model-context';

/** Envelope version shared with the dev server's `/message` socket (`socketMessages.ts`). */
const SOCKET_PROTOCOL_VERSION = 2;

type MessageId = string | number;

interface RequestMessage {
  id?: MessageId;
  method: string;
  params?: unknown;
}

interface ResponseMessage {
  id: MessageId;
  result?: unknown;
  error?: { code: number; message: string };
}

interface ToolsCallParams {
  name: string;
  arguments?: Record<string, unknown>;
  timeoutMs?: number;
}

/** The subset of the WebSocket API the client uses. `WebSocketWithReconnect` satisfies it. */
export type ModelContextSocket = Pick<
  WebSocket,
  'send' | 'close' | 'readyState' | 'addEventListener' | 'removeEventListener'
>;

export interface ModelContextClientOptions {
  /** Where the dev server is. Defaults to `getConnectionInfo()`. */
  getConnectionInfo: () => Pick<ConnectionInfo, 'devServer' | 'useWss'>;
  /** Creates the socket. Defaults to `WebSocketWithReconnect`. Used for injection when testing. */
  createWebSocket?: (url: string) => ModelContextSocket;
  /** Platform name sent in the handshake. */
  platform?: string;
}

/**
 * Registers tools with the Expo dev server over a WebSocket and runs them when the dev server
 * forwards a `tools/call`. One instance per app runtime.
 */
export class ModelContextClient implements ModelContext {
  private tools = new Map<string, ModelContextTool<any>>();
  private stacks = new Map<string, string | undefined>();
  private ws: ModelContextSocket | null = null;

  constructor(private readonly options: ModelContextClientOptions) {}

  registerTool(
    tool: ModelContextTool<any>,
    options?: RegisterToolOptions
  ): ModelContextToolSubscription {
    validateToolLocally(tool);
    if (options?.signal?.aborted) {
      return { remove: () => {} };
    }

    // Capture the call site so the dev server can attribute the tool to the app or to a package.
    const stack = options?.stack ?? new Error().stack;
    this.tools.set(tool.name, tool);
    this.stacks.set(tool.name, stack);

    if (this.ws == null) {
      // The first connection sends every registration from the `open` handler.
      this.connect();
    } else {
      this.sendRegistration(tool.name);
    }

    const remove = () => this.unregisterTool(tool.name);
    options?.signal?.addEventListener('abort', remove, { once: true });
    return { remove };
  }

  unregisterTool(name: string): void {
    if (!this.tools.delete(name)) {
      return;
    }
    this.stacks.delete(name);
    this.send({ method: 'modelContext/unregisterTool', params: { name } });
  }

  getTools(): ModelContextTool<any>[] {
    return [...this.tools.values()];
  }

  /** Close the connection. Tools stay registered locally. */
  close(): void {
    this.ws?.close();
    this.ws = null;
  }

  /** Whether the WebSocket to the dev server is open. */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private connect(): void {
    const { devServer, useWss } = this.options.getConnectionInfo();
    const url = `${useWss ? 'wss' : 'ws'}://${devServer}${MODEL_CONTEXT_ENDPOINT}`;
    const create =
      this.options.createWebSocket ??
      ((url: string) =>
        new WebSocketWithReconnect(url, {
          onError: (error) => logger.warn(`[modelContext] ${error.message}`),
        }));

    const ws = create(url);
    this.ws = ws;

    // `WebSocketWithReconnect` fires `open` again after every reconnect, so the dev server gets
    // the full tool list each time.
    ws.addEventListener('open', () => {
      this.send({
        method: 'modelContext/hello',
        params: {
          protocolVersion: MODEL_CONTEXT_PROTOCOL_VERSION,
          platform: this.options.platform,
        },
      });
      for (const name of this.tools.keys()) {
        this.sendRegistration(name);
      }
    });
    ws.addEventListener('message', (event: MessageEvent) => {
      this.handleMessage(event.data);
    });
  }

  private sendRegistration(name: string): void {
    const tool = this.tools.get(name);
    if (!tool) {
      return;
    }
    this.send({
      method: 'modelContext/registerTool',
      params: {
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        stack: this.stacks.get(name),
      },
    });
  }

  private send(message: RequestMessage | ResponseMessage): void {
    // `WebSocketWithReconnect` queues messages until the socket is open.
    this.ws?.send(JSON.stringify({ ...message, version: SOCKET_PROTOCOL_VERSION }));
  }

  private handleMessage(data: unknown): void {
    if (typeof data !== 'string') {
      return;
    }
    let message: RequestMessage & { version?: number };
    try {
      message = JSON.parse(data);
    } catch {
      return;
    }
    if (message?.version !== SOCKET_PROTOCOL_VERSION || typeof message.method !== 'string') {
      return;
    }
    if (message.method === 'tools/call' && message.id != null) {
      this.handleToolCall(message.id, message.params as ToolsCallParams);
    }
  }

  private async handleToolCall(id: MessageId, params: ToolsCallParams): Promise<void> {
    const tool = params != null ? this.tools.get(params.name) : undefined;
    if (!tool) {
      this.send({
        id,
        error: { code: -32601, message: `Tool not found: ${params?.name}` },
      });
      return;
    }

    const controller = new AbortController();
    const timeout =
      typeof params.timeoutMs === 'number' && params.timeoutMs > 0
        ? setTimeout(() => controller.abort(), params.timeoutMs)
        : null;
    try {
      const result: ModelContextToolResult = await tool.execute(params.arguments ?? {}, {
        signal: controller.signal,
      });
      this.send({ id, result });
    } catch (error: any) {
      this.send({
        id,
        error: { code: -32000, message: error?.message ?? String(error) },
      });
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }
}

const TOOL_NAME_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

function validateToolLocally(tool: ModelContextTool<any>): void {
  if (typeof tool?.name !== 'string' || !TOOL_NAME_PATTERN.test(tool.name)) {
    throw new TypeError(
      `Invalid tool name "${tool?.name}". Use 1-64 characters from a-z, A-Z, 0-9, "_" and "-".`
    );
  }
  if (typeof tool.description !== 'string' || tool.description.length === 0) {
    throw new TypeError(`Tool "${tool.name}" needs a non-empty description.`);
  }
  if (tool.inputSchema == null || typeof tool.inputSchema !== 'object') {
    throw new TypeError(`Tool "${tool.name}" needs an object "inputSchema" (JSON Schema).`);
  }
  if (typeof tool.execute !== 'function') {
    throw new TypeError(`Tool "${tool.name}" needs an "execute" function.`);
  }
}

/** A `ModelContext` that does nothing. Used in production builds. */
export const noopModelContext: ModelContext = {
  registerTool: () => ({ remove: () => {} }),
  unregisterTool: () => {},
  getTools: () => [],
};
