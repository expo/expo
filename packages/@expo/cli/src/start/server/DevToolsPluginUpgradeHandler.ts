import { STATUS_CODES, type IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import { WebSocketServer } from 'ws';

import type DevToolsPluginManager from './DevToolsPluginManager';
import { DevToolsPluginEndpoint } from './DevToolsPluginManager';
import { parsePluginName } from './DevToolsPluginServerHelpers';
import {
  attachWebSocketHooks,
  convertUpgradeRequest,
  createUpgradeRequestContext,
  getUpgradeHooks,
} from './DevToolsPluginSocketHelpers';

const debug = require('debug')('expo:start:server:devtools') as typeof console.log;

type DevToolsPluginUpgradeHandler = (
  request: IncomingMessage,
  socket: Duplex,
  head: Buffer
) => Promise<boolean>;

/**
 * Creates the dynamic WebSocket upgrade dispatcher for DevTools plugins. Upgrade requests under
 * `/_expo/plugins/<name>/...` that no statically mounted endpoint claimed are routed to the
 * plugin's fetch request handler with an upgradeable context. The handler commits the handshake
 * by returning `context.upgrade(hooks)`, rejects it by returning a plain `Response`, or declines
 * by returning `null`/`undefined` (the returned `upgradeHandler` resolves to `false` and the
 * caller destroys the socket).
 *
 * All connections share one `ws` server in `noServer` mode, returned as `dummyUpgradeEndpoint`
 * for the caller to merge into the dev server's `websocketEndpoints`, so it is closed (and its
 * clients terminated) on dev server shutdown.
 */
export function createDevToolsPluginUpgradeHandler(pluginManager: DevToolsPluginManager): {
  upgradeHandler: DevToolsPluginUpgradeHandler;
  dummyUpgradeEndpoint: Record<string, WebSocketServer>;
} {
  const webSocketServer = new WebSocketServer({ noServer: true });

  const upgradeHandler: DevToolsPluginUpgradeHandler = async (request, socket, head) => {
    const { pathname } = new URL(request.url ?? '/', 'http://localhost');
    if (!pathname.startsWith(`${DevToolsPluginEndpoint}/`)) {
      return false;
    }

    const pluginName = parsePluginName(pathname.substring(DevToolsPluginEndpoint.length + 1));
    const plugin = await pluginManager.queryPluginAsync(pluginName);
    if (!plugin || plugin.serverEntryPoint == null) {
      return false;
    }

    const pathInPluginRoot =
      pathname.substring(DevToolsPluginEndpoint.length + pluginName.length + 1) || '/';
    const upgradeRequest = convertUpgradeRequest(request, pathInPluginRoot);

    let response: Response | null | undefined;
    try {
      const handler = await plugin.getRequestHandlerAsync();
      response = await handler?.(upgradeRequest, createUpgradeRequestContext());
    } catch (error: any) {
      debug('DevTools plugin upgrade request failed: %O', error);
      await writeResponseToSocket(
        socket,
        new Response(
          `The DevTools plugin "${plugin.packageName}" failed to handle the WebSocket upgrade to "${pathInPluginRoot}": ` +
            `${error?.message ?? error}. This is likely a bug in the plugin's server entry point ` +
            `(${plugin.serverEntryPoint}); report it to the plugin author.`,
          { status: 500, headers: { 'Content-Type': 'text/plain' } }
        )
      );
      return true;
    }

    if (response == null) {
      return false;
    }

    const hooks = getUpgradeHooks(response);
    if (!hooks) {
      // A plain response rejects the upgrade and is written back over the raw socket.
      await writeResponseToSocket(socket, response);
      return true;
    }

    const onHeaders = (headers: string[], headersRequest: IncomingMessage) => {
      if (headersRequest !== request) {
        return;
      }
      for (const [name, value] of response.headers) {
        headers.push(`${name}: ${value}`);
      }
    };
    webSocketServer.on('headers', onHeaders);
    try {
      webSocketServer.handleUpgrade(request, socket, head, (ws) => {
        attachWebSocketHooks(ws, hooks);
      });
    } finally {
      webSocketServer.off('headers', onHeaders);
    }
    return true;
  };

  return {
    upgradeHandler,
    dummyUpgradeEndpoint: {
      // The key with no leading slash will never match, ensuring no conflicts with exact-path endpoints.
      // https://github.com/expo/expo/blob/8bf7d23a090d2d9f7affbefb7d7c983d53cd2735/packages/%40expo/cli/src/start/server/metro/runServer-fork.ts#L183
      // We add the server to ensure automatic close handling.
      '__/expo-dev-plugins/upgrade': webSocketServer,
    },
  };
}

/** Serializes a fetch API `Response` as a raw HTTP/1.1 response onto an upgrade socket. */
async function writeResponseToSocket(socket: Duplex, response: Response): Promise<void> {
  const body = Buffer.from(await response.arrayBuffer());
  const statusText = response.statusText || STATUS_CODES[response.status] || '';
  const headers = new Headers(response.headers);
  if (!headers.has('content-length')) {
    headers.set('content-length', String(body.byteLength));
  }
  headers.set('connection', 'close');

  let head = `HTTP/1.1 ${response.status} ${statusText}\r\n`;
  for (const [name, value] of headers) {
    head += `${name}: ${value}\r\n`;
  }
  socket.write(head + '\r\n');
  socket.end(body);
}
