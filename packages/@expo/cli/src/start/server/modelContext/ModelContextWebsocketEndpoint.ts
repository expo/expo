import type { IncomingMessage } from 'node:http';
import { type WebSocket, WebSocketServer } from 'ws';

import { isMatchingOrigin } from '../../../utils/net';
import { parseRawMessage, serializeMessage } from '../metro/dev-server/utils/socketMessages';
import {
  LIMITS,
  RequestMessageSchema,
  ResponseMessageSchema,
  ToolDescriptorSchema,
  UnregisterToolParamsSchema,
  formatIssues,
} from './ModelContext.schema';
import type { ModelContextRegistry } from './ModelContextRegistry';

export const MODEL_CONTEXT_ENDPOINT = '/_expo/model-context';

let nextConnectionId = 1;

const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * WebSocket endpoint apps use to register runtime tools. Messages use the same envelope as the
 * `/message` socket and every payload is validated with Zod before it reaches the registry.
 */
export function createModelContextWebsocketEndpoint({
  registry,
  serverBaseUrl,
  getTunnelUrl,
}: {
  registry: ModelContextRegistry;
  serverBaseUrl: string;
  /** Read on each connection, because the tunnel can start after Metro. */
  getTunnelUrl?: () => string | null;
}): Record<string, WebSocketServer> {
  const wss = new WebSocketServer({ noServer: true, maxPayload: LIMITS.messageBytes });

  wss.on('connection', (socket: WebSocket, request: IncomingMessage) => {
    // Native apps send no origin, so devices on the LAN still connect.
    // This only stops other websites open in the developer's browser.
    if (!isAllowedOrigin(request, serverBaseUrl, getTunnelUrl?.() ?? null)) {
      socket.close(1008, 'Origin does not match the dev server.');
      return;
    }

    const connectionId = `mc-${nextConnectionId++}`;
    registry.addConnection({
      id: connectionId,
      send: (message) => socket.send(serializeMessage(message)),
    });

    const reply = (
      id: string | number | undefined,
      body: { result?: unknown; error?: unknown }
    ) => {
      if (id != null) socket.send(serializeMessage({ id, ...body }));
    };

    socket.on('message', (data, isBinary) => {
      const message = parseRawMessage<Record<string, unknown>>(data, isBinary);
      if (message == null) return;

      if (!('method' in message)) {
        const response = ResponseMessageSchema.safeParse(message);
        if (response.success) registry.handleResponse(connectionId, response.data);
        return;
      }
      const request = RequestMessageSchema.safeParse(message);
      if (!request.success) return;
      const { id, method, params } = request.data;

      try {
        switch (method) {
          case 'modelContext/registerTool': {
            const tool = ToolDescriptorSchema.parse(params);
            registry.registerTool(connectionId, tool);
            reply(id, { result: { name: tool.name } });
            break;
          }
          case 'modelContext/unregisterTool': {
            const { name } = UnregisterToolParamsSchema.parse(params);
            reply(id, { result: { removed: registry.unregisterTool(connectionId, name) } });
            break;
          }
          default:
            reply(id, { error: { code: -32601, message: `Method not found: ${method}` } });
        }
      } catch (error: any) {
        const message =
          error?.name === 'ZodError'
            ? `Invalid params for ${method}: ${formatIssues(error)}`
            : (error?.message ?? String(error));
        reply(id, { error: { code: -32602, message } });
      }
    });

    const cleanup = () => registry.removeConnection(connectionId);
    socket.on('close', cleanup);
    socket.on('error', cleanup);
  });

  return { [MODEL_CONTEXT_ENDPOINT]: wss };
}

/**
 * Same-origin check for web apps.
 * A page can open on any loopback name for the dev server's port, or on the tunnel host.
 */
function isAllowedOrigin(
  request: IncomingMessage,
  serverBaseUrl: string,
  tunnelUrl: string | null
): boolean {
  if (isMatchingOrigin(request, serverBaseUrl)) {
    return true;
  }
  let origin: URL;
  try {
    origin = new URL(`${request.headers.origin}`);
  } catch {
    return false;
  }
  const server = new URL(serverBaseUrl);
  if (
    LOOPBACK_HOSTNAMES.has(origin.hostname) &&
    LOOPBACK_HOSTNAMES.has(server.hostname) &&
    origin.port === server.port
  ) {
    return true;
  }
  return tunnelUrl != null && origin.host === new URL(tunnelUrl).host;
}
