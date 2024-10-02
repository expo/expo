import { format as prettyFormat, plugins as prettyPlugins } from 'pretty-format';
import { WebSocketServer } from 'ws';

import type { createMessagesSocket } from './createMessageSocket';
import { createBroadcaster } from './utils/createSocketBroadcaster';
import { createSocketMap } from './utils/createSocketMap';
import { parseRawMessage, serializeMessage } from './utils/socketMessages';

const debug = require('debug')('expo:metro:devserver:eventsSocket') as typeof console.log;

type EventsSocketOptions = {
  /** The message endpoint broadcaster, used to relay commands from Metro */
  broadcast: ReturnType<typeof createMessagesSocket>['broadcast'];
};

/**
 * Metro events server that dispatches all Metro events to connected clients.
 * This includes logs, errors, bundling progression, etc.
 */
export function createEventsSocket(options: EventsSocketOptions) {
  const clients = createSocketMap();
  const broadcast = createBroadcaster(clients.map);

  const server = new WebSocketServer({
    noServer: true,
    verifyClient({ origin }: { origin: string }) {
      // This exposes the full JS logs and enables issuing commands like reload
      // so let's make sure only locally running stuff can connect to it
      // origin is only checked if it is set, e.g. when the request is made from a (CORS) browser
      // any 'back-end' connection isn't CORS at all, and has full control over the origin header,
      // so there is no point in checking it security wise
      return !origin || origin.startsWith('http://localhost:') || origin.startsWith('file:');
    },
  });

  server.on('connection', (socket) => {
    const client = clients.registerSocket(socket);

    // Register disconnect handlers
    socket.on('close', client.terminate);
    socket.on('error', client.terminate);
    // Register message handler
    socket.on('message', (data, isBinary) => {
      const message = parseRawMessage<Command>(data, isBinary);
      if (!message) return;

      if (message.type === 'command') {
        options.broadcast(message.command, message.params);
      } else {
        debug(`Received unknown message type: ${message.type}`);
      }
    });
  });

  return {
    endpoint: '/events' as const,
    server: new WebSocketServer({ noServer: true }),
    reportMetroEvent: (event: any) => {
      // Avoid serializing data if there are no clients
      if (!clients.map.size) {
        return;
      }

      return broadcast(null, serializeMetroEvent(event));
    },
  };
}

type Command = {
  type: 'command';
  command: string;
  params?: any;
};

function serializeMetroEvent(message: any): string {
  // Some types reported by Metro are not serializable
  if (message && message.error && message.error instanceof Error) {
    return serializeMessage({
      ...message,
      error: prettyFormat(message.error, {
        escapeString: true,
        highlight: true,
        maxDepth: 3,
        min: true,
      }),
    });
  }

  if (message && message.type === 'client_log') {
    return serializeMessage({
      ...message,
      data: message.data.map((item: any) =>
        typeof item === 'string'
          ? item
          : prettyFormat(item, {
              escapeString: true,
              highlight: true,
              maxDepth: 3,
              min: true,
              plugins: [prettyPlugins.ReactElement],
            })
      ),
    });
  }

  return serializeMessage(message);
}
