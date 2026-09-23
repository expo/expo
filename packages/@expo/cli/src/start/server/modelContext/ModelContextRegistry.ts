import { Log } from '../../../log';
import {
  type RegisterToolParams,
  type ResponseMessage,
  type ToolDescriptor,
  type ToolResult,
  ToolResultSchema,
  formatIssues,
} from './ModelContext.schema';
import {
  type BlockReason,
  EMPTY_POLICY,
  type ModelContextPolicy,
  type ToolOwner,
  describeBlockReason,
  describeOwner,
  evaluatePolicy,
  resolveToolOwnerAsync,
} from './ModelContextPolicy';

const DEFAULT_CALL_TIMEOUT_MS = 10_000;
const MAX_CALL_TIMEOUT_MS = 60_000;

/** An app runtime connected to the registry. */
export interface ModelContextConnection {
  id: string;
  /** Local socket with a matching origin. See `isLocalSocket` and `isMatchingOrigin`. */
  trusted: boolean;
  platform?: string;
  /** Sends a message to the app. The transport adds its envelope. */
  send(message: Record<string, unknown>): void;
}

export interface RegisteredTool {
  /** Name as the app registered it. */
  name: string;
  /** Name shown to agents. Namespaced by owner so package tools cannot look like app tools. */
  mcpName: string;
  descriptor: ToolDescriptor;
  owner: ToolOwner;
  connectionId: string;
  status: 'allowed' | 'blocked';
  blockedReason?: BlockReason;
}

interface ConnectionState extends ModelContextConnection {
  hello: boolean;
  toolNames: Set<string>;
}

interface PendingCall {
  resolve: (result: ToolResult) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
  connectionId: string;
}

export class ToolRegistrationError extends Error {
  constructor(
    message: string,
    public readonly code: number = -32602
  ) {
    super(message);
    this.name = 'ToolRegistrationError';
  }
}

/**
 * Holds tools that running apps register at runtime, decides which are exposed to agents, and
 * forwards agent calls to the app that owns the tool.
 *
 * Everything that arrives from an app is treated as data. The registry never loads code.
 */
export class ModelContextRegistry {
  private connections = new Map<string, ConnectionState>();
  private tools = new Map<string, RegisteredTool>();
  private pendingCalls = new Map<string, PendingCall>();
  private nextCallId = 1;
  private policy: ModelContextPolicy = EMPTY_POLICY;
  private resolveOwner = resolveToolOwnerAsync;

  constructor(public readonly projectRoot: string) {}

  /** Set once the dev server has loaded the app config. */
  configure(options: {
    policy?: ModelContextPolicy;
    /** Used for injection when testing. */
    resolveOwner?: typeof resolveToolOwnerAsync;
  }) {
    if (options.policy) this.policy = options.policy;
    if (options.resolveOwner) this.resolveOwner = options.resolveOwner;
  }

  addConnection(connection: ModelContextConnection): void {
    this.connections.set(connection.id, { ...connection, hello: false, toolNames: new Set() });
  }

  markHello(connectionId: string, platform?: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.hello = true;
      if (platform) connection.platform = platform;
    }
  }

  removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    this.connections.delete(connectionId);

    for (const name of connection.toolNames) {
      if (this.tools.get(name)?.connectionId === connectionId) {
        this.tools.delete(name);
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

  async registerToolAsync(
    connectionId: string,
    params: RegisterToolParams
  ): Promise<RegisteredTool> {
    const connection = this.connections.get(connectionId);
    if (!connection?.hello) {
      throw new ToolRegistrationError(
        'Send "modelContext/hello" before registering tools.',
        -32600
      );
    }

    const { stack, ...descriptor } = params;
    const owner = await this.resolveOwner({ stack, projectRoot: this.projectRoot });

    // First owner wins. A package cannot shadow an app tool, and the app cannot take over a
    // package tool while that package still holds the name.
    const existing = this.tools.get(descriptor.name);
    if (existing && !sameOwner(existing.owner, owner)) {
      throw new ToolRegistrationError(
        `Tool "${descriptor.name}" is already registered by ${describeOwner(existing.owner)}.`
      );
    }
    if (existing && existing.connectionId !== connectionId) {
      this.connections.get(existing.connectionId)?.toolNames.delete(descriptor.name);
    }

    const decision = evaluatePolicy(owner, descriptor.name, this.policy, connection.trusted);
    const tool: RegisteredTool = {
      name: descriptor.name,
      mcpName: toMcpName(descriptor.name, owner),
      descriptor,
      owner,
      connectionId,
      status: decision.allowed ? 'allowed' : 'blocked',
      ...(decision.allowed ? {} : { blockedReason: decision.reason }),
    };
    this.tools.set(tool.name, tool);
    connection.toolNames.add(tool.name);

    if (tool.status === 'blocked') {
      Log.debug(
        `[model-context] Tool "${tool.name}" from ${describeOwner(owner)} is blocked: ` +
          describeBlockReason(tool.blockedReason!, owner)
      );
    }
    return tool;
  }

  unregisterTool(connectionId: string, name: string): boolean {
    const tool = this.tools.get(name);
    if (!tool || tool.connectionId !== connectionId) {
      return false;
    }
    this.tools.delete(name);
    this.connections.get(connectionId)?.toolNames.delete(name);
    return true;
  }

  listTools(): RegisteredTool[] {
    return [...this.tools.values()];
  }

  listAllowedTools(): RegisteredTool[] {
    return this.listTools().filter((tool) => tool.status === 'allowed');
  }

  listBlockedTools(): RegisteredTool[] {
    return this.listTools().filter((tool) => tool.status === 'blocked');
  }

  getToolByMcpName(mcpName: string): RegisteredTool | undefined {
    return this.listTools().find((tool) => tool.mcpName === mcpName);
  }

  /** Forward a call to the app that registered the tool. Blocked tools cannot be called. */
  async callToolAsync(
    mcpName: string,
    args: Record<string, unknown> | undefined,
    options: { timeoutMs?: number } = {}
  ): Promise<ToolResult> {
    const tool = this.getToolByMcpName(mcpName);
    if (!tool) {
      throw new Error(`Unknown tool "${mcpName}". Call "app_list_tools" to see available tools.`);
    }
    if (tool.status === 'blocked') {
      throw new Error(
        `Tool "${mcpName}" is blocked: ${describeBlockReason(tool.blockedReason!, tool.owner)}.`
      );
    }
    const connection = this.connections.get(tool.connectionId);
    if (!connection) {
      throw new Error(`The app that registered "${mcpName}" is no longer connected.`);
    }

    const timeoutMs = Math.min(
      Math.max(options.timeoutMs ?? DEFAULT_CALL_TIMEOUT_MS, 1),
      MAX_CALL_TIMEOUT_MS
    );
    const callId = `call-${this.nextCallId++}`;

    return new Promise<ToolResult>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingCalls.delete(callId);
        reject(new Error(`Tool "${mcpName}" timed out after ${timeoutMs}ms.`));
      }, timeoutMs);
      this.pendingCalls.set(callId, { resolve, reject, timeout, connectionId: connection.id });
      try {
        connection.send({
          id: callId,
          method: 'tools/call',
          params: { name: tool.name, arguments: args ?? {}, timeoutMs },
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

function sameOwner(a: ToolOwner, b: ToolOwner): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'package' && b.kind === 'package') return a.name === b.name;
  return true;
}

/** `app__<name>` for app tools, `pkg_<package>__<name>` for package tools. */
export function toMcpName(name: string, owner: ToolOwner): string {
  switch (owner.kind) {
    case 'project':
      return `app__${name}`;
    case 'package':
      return `pkg_${owner.name.replace(/^@/, '').replace(/[^a-zA-Z0-9_-]/g, '_')}__${name}`;
    default:
      return `unknown__${name}`;
  }
}
