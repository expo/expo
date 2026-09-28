import { WebSocketWithReconnect } from '../WebSocketWithReconnect';
import type { ConnectionInfo } from '../devtools.types';
import type {
  ModelContext,
  ModelContextTool,
  ModelContextToolResult,
  ModelContextToolSubscription,
  RegisterToolOptions,
} from './ModelContext.types';

export const MODEL_CONTEXT_ENDPOINT = '/_expo/model-context';

/** The dev server drops a reply whose error message is longer than this. */
const MAX_ERROR_MESSAGE_LENGTH = 1024;

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

interface IncomingMessage extends Partial<RequestMessage>, Partial<ResponseMessage> {
  version?: number;
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
}

/**
 * Registers tools with the Expo dev server over a WebSocket and runs them when the dev server
 * forwards a `tools/call`. One instance per app runtime.
 */
export class ModelContextClient implements ModelContext {
  private tools = new Map<string, ModelContextTool<any>>();
  /** The latest registration of each name. An older subscription must not remove a newer tool. */
  private registrationTokens = new Map<string, symbol>();
  private ws: ModelContextSocket | null = null;
  private nextRequestId = 1;
  /** Register request id → tool name, so a rejection can be reported. */
  private pendingRegistrations = new Map<string, string>();

  constructor(private readonly options: ModelContextClientOptions) {}

  registerTool(
    tool: ModelContextTool<any>,
    options?: RegisterToolOptions
  ): ModelContextToolSubscription {
    validateToolLocally(tool);
    if (options?.signal?.aborted) {
      return { remove: () => {} };
    }

    const token = Symbol(tool.name);
    this.tools.set(tool.name, tool);
    this.registrationTokens.set(tool.name, token);

    if (this.ws == null) {
      // The first connection sends every registration from the `open` handler.
      this.connect();
    } else {
      this.sendRegistration(tool.name);
    }

    const remove = () => {
      options?.signal?.removeEventListener('abort', remove);
      if (this.registrationTokens.get(tool.name) === token) {
        this.unregisterTool(tool.name);
      }
    };
    options?.signal?.addEventListener('abort', remove, { once: true });
    return { remove };
  }

  unregisterTool(name: string): void {
    this.registrationTokens.delete(name);
    if (!this.tools.delete(name)) {
      return;
    }
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
          onError: (error) => console.warn(`[modelContext] ${error.message}`),
        }));

    const ws = create(url);
    this.ws = ws;

    // `WebSocketWithReconnect` emits `close` only when it stops retrying.
    // Clear it so the next registration connects again.
    ws.addEventListener('close', () => {
      if (this.ws === ws) {
        this.ws = null;
      }
    });

    // `WebSocketWithReconnect` fires `open` again after every reconnect, so the dev server gets
    // the full tool list each time. Replies to the previous socket can no longer arrive.
    ws.addEventListener('open', () => {
      this.pendingRegistrations.clear();
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
    const id = `reg-${this.nextRequestId++}`;
    this.pendingRegistrations.set(id, name);
    this.send({
      id,
      method: 'modelContext/registerTool',
      params: {
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
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
    let message: IncomingMessage;
    try {
      message = JSON.parse(data);
    } catch {
      return;
    }
    if (message?.version !== SOCKET_PROTOCOL_VERSION) {
      return;
    }
    if (message.method === 'tools/call' && message.id != null) {
      this.handleToolCall(message.id, message.params as ToolsCallParams);
      return;
    }
    if (typeof message.method !== 'string' && message.id != null) {
      this.handleRegistrationResponse(message);
    }
  }

  private handleRegistrationResponse(message: IncomingMessage): void {
    const name = this.pendingRegistrations.get(String(message.id));
    if (name == null) {
      return;
    }
    this.pendingRegistrations.delete(String(message.id));

    if (message.error) {
      // logger.warn stays silent unless the app opts in.
      // A rejected tool should show up anyway.
      console.warn(`[modelContext] Tool "${name}" was rejected: ${message.error.message}`);
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
        error: {
          code: -32000,
          message: String(error?.message ?? error).slice(0, MAX_ERROR_MESSAGE_LENGTH),
        },
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

/** A `ModelContext` that does nothing. Used outside `__DEV__`. */
export const noopModelContext: ModelContext = {
  registerTool: () => ({ remove: () => {} }),
  unregisterTool: () => {},
  getTools: () => [],
};
