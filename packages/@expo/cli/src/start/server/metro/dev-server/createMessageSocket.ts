import { WebSocketServer, type RawData as WebSocketRawData } from 'ws';

import { createBroadcaster } from './createSocketBroadcaster';
import { createSocketMap, type SocketId } from './createSocketMap';
import { parseRawMessage, serializeMessage } from './socketMessages';

type MessageSocketOptions = {
  logger: {
    warn: (message: string) => any;
  };
};

export function createMessagesSocket(options: MessageSocketOptions) {
  const clients = createSocketMap();
  const broadcast = createBroadcaster(clients.map);

  const server = new WebSocketServer({ noServer: true });

  server.on('connection', (socket) => {
    const client = clients.registerSocket(socket);

    // Register disconnect handlers
    socket.on('close', client.terminate);
    socket.on('error', client.terminate);
    // Register message handler
    socket.on('message', createClientMessageHandler(client.id, clients, broadcast));
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
  clientId: SocketId,
  clients: ReturnType<typeof createSocketMap>,
  broadcast: ReturnType<typeof createBroadcaster>
) {
  return (data: WebSocketRawData, isBinary: boolean) => {
    const message = parseRawMessage<IncomingMessage>(data, isBinary);
    if (!message) return;

    // Handle broadcast messages
    if (messageIsBroadcast(message)) {
      return broadcast(null, data.toString());
    }

    // Handle incoming requests from clients
    if (messageIsRequest(message)) {
      // Ignore legacy server messages
      if (message.target === 'server') return;

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
