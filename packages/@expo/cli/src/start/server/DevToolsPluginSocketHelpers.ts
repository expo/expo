import { loadModule } from '@expo/require-utils';
import type { IncomingMessage } from 'node:http';
import { type RawData, type WebSocket, WebSocketServer } from 'ws';

const debug = require('debug')('expo:start:server:devtools') as typeof console.log;

/**
 * Incoming WebSocket message passed to the `message` hook, with lazy conversion helpers
 * mirroring the fetch API `Body` readers.
 */
type WebSocketMessage = {
  readonly rawData: RawData;
  readonly isBinary: boolean;
  text(): string;
  json<T = unknown>(): T;
  uint8Array(): Uint8Array;
  arrayBuffer(): ArrayBuffer;
};

/**
 * Connected WebSocket peer passed to the lifecycle hooks. `send` serializes plain objects
 * as JSON; strings and binary payloads are sent as-is. The raw `ws` socket is exposed as
 * an escape hatch.
 */
type WebSocketPeer = {
  readonly socket: WebSocket;
  send(data: string | Buffer | ArrayBufferLike | ArrayBufferView | object): void;
  close(code?: number, reason?: string): void;
  terminate(): void;
};

/** Lifecycle hooks passed to `context.upgrade()`, wired to the socket once the handshake commits. */
type WebSocketHooks = {
  onopen?(peer: WebSocketPeer): void;
  onmessage?(peer: WebSocketPeer, message: WebSocketMessage): void;
  onclose?(peer: WebSocketPeer, details: { code: number; reason: string }): void;
  onerror?(peer: WebSocketPeer, error: Error): void;
};

/**
 * Per-request context passed to a plugin's request handler as the second argument.
 * `upgrade()` does not perform the WebSocket handshake — it returns a marker `Response`
 * that commits the handshake only when the handler returns it. Headers set on that
 * response (including cookies) are written into the `101 Switching Protocols` handshake.
 */
export type RequestContext = {
  upgrade(hooks: WebSocketHooks): Response;
};

const upgradeHooksRegistry = new WeakMap<Response, WebSocketHooks>();

/** Creates the request context for WebSocket Upgrade requests. */
export function createUpgradeRequestContext(): RequestContext {
  return {
    upgrade(hooks) {
      const response = new Response(null, {
        statusText: 'Switching Protocols',
      });
      // The fetch API `Response` constructor does not accept informational status codes
      Object.defineProperty(response, 'status', { value: 101 });
      upgradeHooksRegistry.set(response, hooks);
      return response;
    },
  };
}

/** Returns the hooks attached by `context.upgrade()`, or `undefined` for plain responses. */
export function getUpgradeHooks(response: Response | null | undefined): WebSocketHooks | undefined {
  return response ? upgradeHooksRegistry.get(response) : undefined;
}

function toBuffer(data: RawData): Buffer {
  if (Array.isArray(data)) {
    return Buffer.concat(data);
  }
  if (data instanceof ArrayBuffer) {
    return Buffer.from(data);
  }
  return data;
}

function createWebSocketMessage(rawData: RawData, isBinary: boolean): WebSocketMessage {
  return {
    rawData,
    isBinary,
    text: () => toBuffer(rawData).toString('utf8'),
    json: () => JSON.parse(toBuffer(rawData).toString('utf8')),
    uint8Array: () => new Uint8Array(toBuffer(rawData)),
    arrayBuffer: () => {
      const buffer = toBuffer(rawData);
      const arrayBuffer = new ArrayBuffer(buffer.byteLength);
      new Uint8Array(arrayBuffer).set(buffer);
      return arrayBuffer;
    },
  };
}

/** Wires the hooks from `context.upgrade()` to a connected socket. */
export function attachWebSocketHooks(socket: WebSocket, hooks: WebSocketHooks): void {
  const peer: WebSocketPeer = {
    socket,
    send(data) {
      if (
        typeof data === 'string' ||
        Buffer.isBuffer(data) ||
        data instanceof ArrayBuffer ||
        ArrayBuffer.isView(data)
      ) {
        socket.send(data);
      } else {
        socket.send(JSON.stringify(data));
      }
    },
    close: (code, reason) => socket.close(code, reason),
    terminate: () => socket.terminate(),
  };
  const invoke = (hook: () => void) => {
    try {
      hook();
    } catch (error: any) {
      debug('DevTools plugin WebSocket hook failed: %O', error);
      hooks.onerror?.(peer, error);
    }
  };
  socket.on('message', (data, isBinary) =>
    invoke(() => hooks.onmessage?.(peer, createWebSocketMessage(data, isBinary)))
  );
  socket.on('close', (code, reason) =>
    // https://www.rfc-editor.org/info/rfc6455/#section-5.5.1 -> defined UTF-8-encoded data
    invoke(() => hooks.onclose?.(peer, { code, reason: reason.toString() }))
  );
  socket.on('error', (error) => hooks.onerror?.(peer, error));
  invoke(() => hooks.onopen?.(peer));
}

/**
 * Per-connection WebSocket handler exported by a plugin's `serverEntryPoint`. Receives the
 * connected `ws` socket, the upgrade `request`, and the `WebSocketServer` the connection belongs
 * to (use `server.clients` to broadcast). Mirrors the `ws` `'connection'` event so plugin authors
 * use the familiar `socket.on('message', ...)` / `socket.send(...)` API.
 */
export type DevToolsPluginWebSocketHandler = (
  socket: WebSocket,
  request: Request,
  server: WebSocketServer
) => void;

/**
 * Converts a Node.js HTTP Upgrade request to a fetch API `Request`, rewriting the pathname
 * to `route` (the plugin-relative path) while preserving the query string.
 */
export function convertUpgradeRequest(request: IncomingMessage, route: string): Request {
  const proto = 'encrypted' in request.socket && !!request.socket.encrypted ? 'https' : 'http';
  const origin = `${proto}://${request.headers.host}`;
  const url = new URL(request.url ?? '/', origin);
  url.pathname = route;
  const headers = new Headers();
  const { rawHeaders } = request;
  for (let index = 0; index < rawHeaders.length; index += 2) {
    const name = rawHeaders[index];
    const value = rawHeaders[index + 1];
    if (name != null && value != null) {
      headers.append(name, value);
    }
  }
  return new Request(url.href, { method: request.method, headers });
}

export async function loadWebSocketServerAsync({
  packageName,
  serverEntryPoint,
}: {
  packageName: string;
  serverEntryPoint: string;
}): Promise<Record<string, WebSocketServer>> {
  debug('Loading DevTools plugin WebSocket server module: %s', serverEntryPoint);
  const serverModule = (await loadModule(serverEntryPoint)) as {
    webSocketHandlers?: Record<string, DevToolsPluginWebSocketHandler>;
  };
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
      // Routes are mounted relative to the plugin endpoint, so they must be absolute.
      const normalizedRoute = route.startsWith('/') ? route : `/${route}`;
      const server = new WebSocketServer({ noServer: true });
      server.on('connection', (socket, request) =>
        handler(socket, convertUpgradeRequest(request, normalizedRoute), server)
      );
      return [normalizedRoute, server];
    })
  );
}
