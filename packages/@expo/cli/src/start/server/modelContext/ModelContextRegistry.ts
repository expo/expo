import {
  type ResponseMessage,
  type ToolDescriptor,
  type ToolResult,
  ToolResultSchema,
  formatIssues,
} from './ModelContext.schema';

const DEFAULT_CALL_TIMEOUT_MS = 10_000;
const MAX_CALL_TIMEOUT_MS = 60_000;

/** An app runtime connected to the registry. */
export interface ModelContextConnection {
  id: string;
  /** Sends a message to the app. The transport adds its envelope. */
  send(message: Record<string, unknown>): void;
}

export interface RegisteredTool extends ToolDescriptor {
  connectionId: string;
}

interface PendingCall {
  resolve: (result: ToolResult) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
  connectionId: string;
}

/**
 * Holds tools that running apps register at runtime and forwards agent calls to the app that
 * registered the tool.
 *
 * Everything that arrives from an app is treated as data. The registry never loads code.
 */
export class ModelContextRegistry {
  private connections = new Map<string, ModelContextConnection>();
  private tools = new Map<string, RegisteredTool>();
  private pendingCalls = new Map<string, PendingCall>();
  private nextCallId = 1;

  addConnection(connection: ModelContextConnection): void {
    this.connections.set(connection.id, connection);
  }

  removeConnection(connectionId: string): void {
    if (!this.connections.delete(connectionId)) return;

    for (const tool of this.tools.values()) {
      if (tool.connectionId === connectionId) {
        this.tools.delete(tool.name);
      }
    }
    for (const [callId, pending] of this.pendingCalls) {
      if (pending.connectionId === connectionId) {
        clearTimeout(pending.timeout);
        this.pendingCalls.delete(callId);
        pending.reject(new Error('The app disconnected before the tool returned.'));
      }
    }
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  /** The latest registration of a name wins, so a reloaded app replaces its own tools. */
  registerTool(connectionId: string, descriptor: ToolDescriptor): void {
    this.tools.set(descriptor.name, { ...descriptor, connectionId });
  }

  unregisterTool(connectionId: string, name: string): boolean {
    if (this.tools.get(name)?.connectionId !== connectionId) {
      return false;
    }
    return this.tools.delete(name);
  }

  listTools(): RegisteredTool[] {
    return [...this.tools.values()];
  }

  /** Forward a call to the app that registered the tool. */
  async callToolAsync(
    name: string,
    args: Record<string, unknown> | undefined,
    options: { timeoutMs?: number } = {}
  ): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Unknown tool "${name}". Call "app_list_tools" to see available tools.`);
    }
    const connection = this.connections.get(tool.connectionId);
    if (!connection) {
      throw new Error(`The app that registered "${name}" is no longer connected.`);
    }

    const timeoutMs = Math.min(
      Math.max(options.timeoutMs ?? DEFAULT_CALL_TIMEOUT_MS, 1),
      MAX_CALL_TIMEOUT_MS
    );
    const callId = `call-${this.nextCallId++}`;

    return new Promise<ToolResult>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingCalls.delete(callId);
        reject(new Error(`Tool "${name}" timed out after ${timeoutMs}ms.`));
      }, timeoutMs);
      this.pendingCalls.set(callId, { resolve, reject, timeout, connectionId: connection.id });
      try {
        connection.send({
          id: callId,
          method: 'tools/call',
          params: { name, arguments: args ?? {}, timeoutMs },
        });
      } catch (error: any) {
        clearTimeout(timeout);
        this.pendingCalls.delete(callId);
        reject(new Error(`Failed to send the call to the app: ${error?.message ?? error}`));
      }
    });
  }

  /** Handle a response from an app. Returns false if no call is waiting for it. */
  handleResponse(connectionId: string, response: ResponseMessage): boolean {
    const callId = String(response.id);
    const pending = this.pendingCalls.get(callId);
    if (!pending || pending.connectionId !== connectionId) {
      return false;
    }
    clearTimeout(pending.timeout);
    this.pendingCalls.delete(callId);

    if (response.error) {
      pending.reject(new Error(response.error.message));
      return true;
    }
    const parsed = ToolResultSchema.safeParse(response.result);
    if (!parsed.success) {
      pending.reject(
        new Error(`The tool returned an invalid result: ${formatIssues(parsed.error)}`)
      );
      return true;
    }
    pending.resolve(parsed.data);
    return true;
  }
}
