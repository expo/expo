import assert from 'assert';
import { EventEmitter } from 'events';
import WebSocket from 'ws';

let serverInstance: WebSocket.WebSocketServer | null = null;

const eventEmitter = new EventEmitter();

/**
 * Private command to support DevTools frontend reload.
 *
 * The react-devtools maintains state between frontend(webpage) and backend(app).
 * If we reload the frontend without reloading the app, the react-devtools will stuck on incorrect state.
 * We introduce this special reload command.
 * As long as the frontend reload, we will close app's WebSocket connection and tell app to reconnect again.
 */
const RELOAD_COMMAND = 'Expo::RELOAD';

/**
 * Start the react-devtools WebSocket proxy server
 */
export async function startReactDevToolsProxyAsync(options?: { port: number }) {
  if (serverInstance != null) {
    return;
  }

  serverInstance = new WebSocket.WebSocketServer({ port: options?.port ?? 8097 });

  serverInstance.on('connection', function connection(ws) {
    ws.on('message', function message(rawData, isBinary) {
      assert(!isBinary);
      const data = rawData.toString();

      if (data === RELOAD_COMMAND) {
        closeAllOtherClients(ws);
        eventEmitter.emit(RELOAD_COMMAND);
        return;
      }

      serverInstance?.clients.forEach(function each(client) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(data, { binary: isBinary });
        }
      });
    });
  });

  serverInstance.on('close', function () {
    serverInstance = null;
  });
}

/**
 * Close the WebSocket server
 */
export function closeReactDevToolsProxy() {
  serverInstance?.close();
  serverInstance = null;
}

/**
 * add event listener from react-devtools frontend reload
 */
export function addReactDevToolsReloadListener(listener: (...args: any[]) => void) {
  eventEmitter.addListener(RELOAD_COMMAND, listener);
}

/**
 * Close all other WebSocket clients other than the current `self` client
 */
function closeAllOtherClients(self: WebSocket.WebSocket) {
  serverInstance?.clients.forEach(function each(client) {
    if (client !== self && client.readyState === WebSocket.OPEN) {
      client.close();
    }
  });
}
