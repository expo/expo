import { parse } from 'node:url';
import { type WebSocket, WebSocketServer, type RawData as WebSocketRawData } from 'ws';

import { createBroadcaster } from './utils/createSocketBroadcaster';
import { createSocketMap, type SocketId } from './utils/createSocketMap';
import { parseRawMessage, serializeMessage } from './utils/socketMessages';

type MessageSocketOptions = {
  logger: {
    warn: (message: string) => any;
  };
};

/**
 * Client "command" server that dispatches basic commands to connected clients.
 * This basic client to client communication, reload, or open dev menu cli commands.
 */
export function createMessagesSocket(options: MessageSocketOptions) {
  const clients = createSocketMap();
  const broadcast = createBroadcaster(clients.map);

  const server = new WebSocketServer({ noServer: true });

  server.on('connection', (socket, req) => {
    const client = clients.registerSocket(socket);

    // Assign the query parameters to the socket, used for `getpeers` requests
    // NOTE(cedric): this looks like a legacy feature, might be able to drop it
    if (req.url) {
      Object.defineProperty(socket, '_upgradeQuery', {
        value: parse(req.url).query,
      });
    }

    // Register disconnect handlers
    socket.on('close', client.terminate);
    socket.on('error', client.terminate);
    // Register message handler
    socket.on('message', createClientMessageHandler(socket, client.id, clients, broadcast));
  });

  return {
    endpoint: '/message' as const,
    server,
    broadcast: (method: BroadcastMessage['method'], params?: BroadcastMessage['params']) => {
      if (clients.map.size === 0) {
        return options.logger.warn(
          `No apps connected. Sending "${method}" to all React Native apps failed. Make sure your app is running in the simulator or on a phone connected via USB.`
        );
      }

      broadcast(null, serializeMessage({ method, params }));
    },
  };
}

function createClientMessageHandler(
  socket: WebSocket,
  clientId: SocketId,
  clients: ReturnType<typeof createSocketMap>,
  broadcast: ReturnType<typeof createBroadcaster>
) {
  function handleServerRequest(message: RequestMessage) {
    // Ignore messages without identifiers, unable to link responses
    if (!message.id) return;

    if (message.method === 'getid') {
      return socket.send(serializeMessage({ id: message.id, result: clientId }));
    }

    if (message.method === 'getpeers') {
      const peers: Record<string, any> = {};
      clients.map.forEach((peerSocket, peerSocketId) => {
        if (peerSocketId !== clientId) {
          peers[peerSocketId] = '_upgradeQuery' in peerSocket ? peerSocket._upgradeQuery : {};
        }
      });
      return socket.send(serializeMessage({ id: message.id, result: peers }));
    }
  }

  return (data: WebSocketRawData, isBinary: boolean) => {
    const message = parseRawMessage<IncomingMessage>(data, isBinary);
    if (!message) return;

    // Handle broadcast messages
    if (messageIsBroadcast(message)) {
      return broadcast(null, data);
    }

    // Handle incoming requests from clients
    if (messageIsRequest(message)) {
      if (message.target === 'server') {
        return handleServerRequest(message);
      }

      return clients.findSocket(message.target)?.send(
        serializeMessage({
          method: message.method,
          params: message.params,
          id: !message.id
            ? undefined
            : {
                requestId: message.id,
                clientId,
              },
        })
      );
    }

    // Handle incoming responses
    if (messageIsResponse(message)) {
      return clients.findSocket(message.id.clientId)?.send(
        serializeMessage({
          id: message.id.requestId,
          result: message.result,
          error: message.error,
        })
      );
    }
  };
}

type MessageId = {
  requestId: string;
  clientId: SocketId;
};

type IncomingMessage = BroadcastMessage | RequestMessage | ResponseMessage;

type BroadcastMessage = {
  method: string;
  params?: Record<string, any>;
};

type RequestMessage = {
  method: string;
  params?: Record<string, any>;
  target: string;
  id?: string;
};

type ResponseMessage = {
  result?: any;
  error?: Error;
  id: MessageId;
};

function messageIsBroadcast(message: IncomingMessage): message is BroadcastMessage {
  return (
    'method' in message &&
    typeof message.method === 'string' &&
    (!('id' in message) || message.id === undefined) &&
    (!('target' in message) || message.target === undefined)
  );
}

function messageIsRequest(message: IncomingMessage): message is RequestMessage {
  return (
    'method' in message &&
    typeof message.method === 'string' &&
    'target' in message &&
    typeof message.target === 'string'
  );
}

function messageIsResponse(message: IncomingMessage): message is ResponseMessage {
  return (
    'id' in message &&
    typeof message.id === 'object' &&
    typeof message.id.requestId !== 'undefined' &&
    typeof message.id.clientId === 'string' &&
    (('result' in message && !!message.result) || ('error' in message && !!message.error))
  );
}
