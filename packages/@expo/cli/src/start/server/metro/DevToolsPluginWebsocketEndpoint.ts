import { WebSocket, WebSocketServer } from 'ws';

import { isMatchingOrigin } from '../../../utils/net';

interface DevToolsPluginWebsocketEndpointParams {
  serverBaseUrl: string;
}

export function createDevToolsPluginWebsocketEndpoint({
  serverBaseUrl,
}: DevToolsPluginWebsocketEndpointParams): Record<string, WebSocketServer> {
  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws, request) => {
    // Explicitly limit devtools websocket to loopback requests
    if (request.headers.origin && !isMatchingOrigin(request, serverBaseUrl)) {
      // NOTE: `socket.close` nicely closes the websocket, which will still allow incoming messages
      // `socket.terminate` instead forcefully closes down the socket
      ws.terminate();
      return;
    }

    ws.on('message', (message, isBinary) => {
      // Broadcast the received message to all other connected clients
      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message, { binary: isBinary });
        }
      });
    });
  });

  return { '/expo-dev-plugins/broadcast': wss };
}
