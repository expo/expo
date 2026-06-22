import { loadModule } from '@expo/require-utils';
import type { IncomingMessage } from 'node:http';
import { type WebSocket, WebSocketServer } from 'ws';

/**
 * Handler default-exported by a plugin's `serverEntryPoint`. Receives a fetch API `Request`
 * with the plugin endpoint prefix stripped from the URL. Returning `null`/`undefined` falls
 * through to static `webpageRoot` serving.
 */
export type DevToolsPluginRequestHandler = (
  request: Request
) => Response | null | undefined | Promise<Response | null | undefined>;

/**
 * Per-connection WebSocket handler exported by a plugin's `serverEntryPoint`. Receives the
 * connected `ws` socket, the upgrade `request`, and the `WebSocketServer` the connection belongs
 * to (use `server.clients` to broadcast). Mirrors the `ws` `'connection'` event so plugin authors
 * use the familiar `socket.on('message', ...)` / `socket.send(...)` API.
 */
export type DevToolsPluginWebSocketHandler = (
  socket: WebSocket,
  request: IncomingMessage,
  server: WebSocketServer
) => void;

export async function loadRequestHandlerAsync({
  packageName,
  serverEntryPoint,
}: {
  packageName: string;
  serverEntryPoint: string;
}): Promise<DevToolsPluginRequestHandler> {
  const serverModule = await loadModule(serverEntryPoint);
  const handler = typeof serverModule === 'function' ? serverModule : serverModule?.default;
  if (typeof handler !== 'function') {
    throw new Error(
      `The serverEntryPoint (${serverEntryPoint}) of plugin ${packageName} ` +
        `must default-export a handler function that takes a Request and returns a Response. ` +
        `Export it as \`export default function handler(request) {}\` ` +
        `or \`exports.default = function handler(request) {}\`.`
    );
  }
  return handler;
}

export async function loadWebSocketServerAsync({
  packageName,
  serverEntryPoint,
}: {
  packageName: string;
  serverEntryPoint: string;
}): Promise<Record<string, WebSocketServer>> {
  const serverModule = await loadModule(serverEntryPoint);
  const handlers: Record<string, DevToolsPluginWebSocketHandler> =
    serverModule?.webSocketHandlers ?? {};

  return Object.fromEntries(
    Object.entries(handlers).map(([route, handler]) => {
      if (typeof handler !== 'function') {
        throw new Error(
          `The webSocketHandlers["${route}"] export of plugin ${packageName} ` +
            `must be a function (socket, request, server) => void.`
        );
      }
      const server = new WebSocketServer({ noServer: true });
      server.on('connection', (socket, request) => handler(socket, request, server));
      // Routes are mounted relative to the plugin endpoint, so they must be absolute.
      return [route.startsWith('/') ? route : `/${route}`, server];
    })
  );
}
