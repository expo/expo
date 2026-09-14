import type { IncomingMessage } from 'node:http';
import { type WebSocket, WebSocketServer } from 'ws';

import { isLocalSocket, isMatchingOrigin } from '../../../utils/net';
import { parseRawMessage, serializeMessage } from '../metro/dev-server/utils/socketMessages';
import {
  HelloParamsSchema,
  LIMITS,
  RegisterToolParamsSchema,
  RequestMessageSchema,
  ResponseMessageSchema,
  UnregisterToolParamsSchema,
  formatIssues,
} from './ModelContext.schema';
import { ModelContextRegistry, ToolRegistrationError } from './ModelContextRegistry';

export const MODEL_CONTEXT_ENDPOINT = '/_expo/model-context';

let nextConnectionId = 1;

/**
 * WebSocket endpoint apps use to register runtime tools. Messages use the same envelope as the
 * `/message` socket and every payload is validated with Zod before it reaches the registry.
 */
export function createModelContextWebsocketEndpoint({
  registry,
  serverBaseUrl,
}: {
  registry: ModelContextRegistry;
  serverBaseUrl: string;
}): Record<string, WebSocketServer> {
  const wss = new WebSocketServer({ noServer: true, maxPayload: LIMITS.messageBytes });

  wss.on('connection', (socket: WebSocket, request: IncomingMessage) => {
    const connectionId = `mc-${nextConnectionId++}`;
    registry.addConnection({
      id: connectionId,
      trusted: isLocalSocket(request.socket) && isMatchingOrigin(request, serverBaseUrl),
      send: (message) => socket.send(serializeMessage(message)),
    });

    const reply = (
      id: string | number | undefined,
      body: { result?: unknown; error?: unknown }
    ) => {
      if (id != null) socket.send(serializeMessage({ id, ...body }));
    };

    socket.on('message', async (data, isBinary) => {
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
          case 'modelContext/hello': {
            registry.markHello(connectionId, HelloParamsSchema.parse(params).platform);
            reply(id, { result: { ok: true } });
            break;
          }
          case 'modelContext/registerTool': {
            const tool = await registry.registerToolAsync(
              connectionId,
              RegisterToolParamsSchema.parse(params)
            );
            reply(id, {
              result: { name: tool.name, status: tool.status, reason: tool.blockedReason },
            });
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
        const code = error instanceof ToolRegistrationError ? error.code : -32602;
        reply(id, { error: { code, message } });
      }
    });

    const cleanup = () => registry.removeConnection(connectionId);
    socket.on('close', cleanup);
    socket.on('error', cleanup);
  });

  return { [MODEL_CONTEXT_ENDPOINT]: wss };
}
