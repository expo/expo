import fs from 'node:fs';
import type { IncomingMessage } from 'node:http';
import { type WebSocket, WebSocketServer } from 'ws';

import type { DevToolsPluginInfo } from './DevToolsPlugin.schema';
import { PluginSchema } from './DevToolsPlugin.schema';
import { DevToolsPluginCliExtensionExecutor } from './DevToolsPluginCliExtensionExecutor';
import { DevToolsPluginEndpoint } from './DevToolsPluginManager';
import { isPathInside } from '../../utils/dir';

const maybeRealpath = (target: string): string => {
  try {
    return fs.realpathSync(target);
  } catch {
    return target;
  }
};

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

/**
 * Class that represents a DevTools plugin with CLI and/or web extensions
 *
 * Responsibilities:
 * - Validates plugin configuration against schema
 * - Provides access to plugin metadata (name, description
 * , endpoints)
 * - Manages CLI command execution via DevToolsPluginExecutor
 * - Lazily initializes executor when needed
 * - Constructs web endpoint URLs based on server configuration
 */
export class DevToolsPlugin {
  constructor(
    private plugin: DevToolsPluginInfo,
    public readonly projectRoot: string
  ) {
    const result = PluginSchema.safeParse(plugin);
    if (!result.success) {
      throw new Error(`Invalid plugin configuration: ${result.error.message}`, {
        cause: result.error,
      });
    }

    if (plugin.webpageRoot != null) {
      const webpageRoot = maybeRealpath(plugin.webpageRoot);
      if (!isPathInside(webpageRoot, plugin.packageRoot)) {
        throw new Error(
          `webpageRoot (${plugin.webpageRoot}) is not inside packageRoot (${plugin.packageRoot}).`
        );
      }
    }

    if (plugin.serverEntryPoint != null) {
      const serverEntryPoint = maybeRealpath(plugin.serverEntryPoint);
      if (!isPathInside(serverEntryPoint, plugin.packageRoot)) {
        throw new Error(
          `serverEntryPoint (${plugin.serverEntryPoint}) is not inside packageRoot (${plugin.packageRoot}).`
        );
      }
    }
  }

  private _executor: DevToolsPluginCliExtensionExecutor | undefined = undefined;
  private _requestHandler: DevToolsPluginRequestHandler | undefined = undefined;
  private _webSocketServers: Record<string, WebSocketServer> | undefined = undefined;

  get packageName(): string {
    return this.plugin.packageName;
  }

  get packageRoot(): string {
    return this.plugin.packageRoot;
  }

  get webpageEndpoint(): string | undefined {
    return this.plugin?.webpageRoot || this.plugin?.serverEntryPoint
      ? `${DevToolsPluginEndpoint}/${this.plugin?.packageName}`
      : undefined;
  }

  get webpageRoot(): string | undefined {
    return this.plugin?.webpageRoot;
  }

  get serverEntryPoint(): string | undefined {
    return this.plugin?.serverEntryPoint;
  }

  /**
   * Lazily loads the request handler from the plugin's `serverEntryPoint`.
   * The entry point must default-export a handler function
   * (`export default function handler(request) {}` or `module.exports = function handler(request) {}`).
   */
  get requestHandler(): DevToolsPluginRequestHandler | undefined {
    if (!this.plugin.serverEntryPoint) {
      return undefined;
    }

    if (!this._requestHandler) {
      const serverModule = require(maybeRealpath(this.plugin.serverEntryPoint));
      const handler = typeof serverModule === 'function' ? serverModule : serverModule?.default;
      if (typeof handler !== 'function') {
        throw new Error(
          `The serverEntryPoint (${this.plugin.serverEntryPoint}) of plugin ${this.plugin.packageName} ` +
            `must default-export a handler function that takes a Request and returns a Response. ` +
            `Export it as \`export default function handler(request) {}\` ` +
            `or \`module.exports = function handler(request) {}\`.`
        );
      }
      this._requestHandler = handler;
    }

    return this._requestHandler;
  }

  /**
   * Lazily builds the WebSocket servers contributed by the plugin's `serverEntryPoint`. The entry
   * point exports a `webSocketHandlers` map of route (e.g. `/ws`) to a connection handler; each
   * route becomes a `ws` `WebSocketServer` (in `noServer` mode) that the dev server mounts under
   * `/_expo/plugins/<name>/<route>`. The fetch API based `requestHandler` cannot serve WebSocket
   * upgrades, so this is how a plugin opts into them. Returns an empty object when the plugin
   * exports no handlers.
   */
  get webSocketServers(): Record<string, WebSocketServer> {
    if (!this.plugin.serverEntryPoint) {
      return {};
    }

    if (!this._webSocketServers) {
      const serverModule = require(maybeRealpath(this.plugin.serverEntryPoint));
      const handlers: Record<string, DevToolsPluginWebSocketHandler> =
        serverModule?.webSocketHandlers ?? {};

      this._webSocketServers = Object.fromEntries(
        Object.entries(handlers).map(([route, handler]) => {
          if (typeof handler !== 'function') {
            throw new Error(
              `The webSocketHandlers["${route}"] export of plugin ${this.plugin.packageName} ` +
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

    return this._webSocketServers;
  }

  get cliBanner(): boolean {
    return this.plugin?.cliBanner ?? false;
  }

  get bannerTitle(): string {
    return this.plugin?.bannerTitle ?? this.plugin.packageName;
  }

  get description(): string {
    return this.plugin.cliExtensions?.description ?? '';
  }

  get cliExtensions(): DevToolsPluginInfo['cliExtensions'] {
    return this.plugin.cliExtensions;
  }

  get executor(): DevToolsPluginCliExtensionExecutor | undefined {
    if (!this.plugin.cliExtensions?.entryPoint) {
      return undefined;
    }

    if (!this._executor) {
      this._executor = new DevToolsPluginCliExtensionExecutor(this.plugin, this.projectRoot);
    }

    return this._executor;
  }
}
