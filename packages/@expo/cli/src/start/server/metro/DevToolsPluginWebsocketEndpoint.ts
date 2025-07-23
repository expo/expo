import { WebSocket, WebSocketServer } from 'ws';

export function createDevToolsPluginWebsocketEndpoint(): Record<string, WebSocketServer> {
  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws: WebSocket) => {
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
