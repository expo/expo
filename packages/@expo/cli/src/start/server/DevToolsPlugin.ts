import type { WebSocketServer } from 'ws';

import { isPathInside, maybeRealpathSync } from '../../utils/dir';
import type { DevToolsPluginInfo } from './DevToolsPlugin.schema';
import { PluginSchema } from './DevToolsPlugin.schema';
import { DevToolsPluginCliExtensionExecutor } from './DevToolsPluginCliExtensionExecutor';
import { DevToolsPluginEndpoint } from './DevToolsPluginManager';
import {
  type DevToolsPluginRequestHandler,
  loadRequestHandlerAsync,
  loadWebSocketServerAsync,
} from './DevToolsPluginServerHelpers';

export type { DevToolsPluginRequestHandler } from './DevToolsPluginServerHelpers';

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
      const webpageRoot = maybeRealpathSync(plugin.webpageRoot) ?? plugin.webpageRoot;
      if (!isPathInside(webpageRoot, plugin.packageRoot)) {
        throw new Error(
          `webpageRoot (${plugin.webpageRoot}) is not inside packageRoot (${plugin.packageRoot}).`
        );
      }
    }

    if (plugin.serverEntryPoint != null) {
      const serverEntryPoint =
        maybeRealpathSync(plugin.serverEntryPoint) ?? plugin.serverEntryPoint;
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
  async getRequestHandlerAsync(): Promise<DevToolsPluginRequestHandler | undefined> {
    if (!this.plugin.serverEntryPoint) {
      return undefined;
    }

    if (!this._requestHandler) {
      this._requestHandler = await loadRequestHandlerAsync({
        packageName: this.plugin.packageName,
        serverEntryPoint: this.plugin.serverEntryPoint,
      });
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
  async getWebSocketServersAsync(): Promise<Record<string, WebSocketServer>> {
    if (!this.plugin.serverEntryPoint) {
      return {};
    }

    if (!this._webSocketServers) {
      this._webSocketServers = await loadWebSocketServerAsync({
        packageName: this.plugin.packageName,
        serverEntryPoint: this.plugin.serverEntryPoint,
      });
    }

    return this._webSocketServers;
  }

  get cliBanner(): boolean {
    return this.plugin.bannerTitle !== undefined && this.plugin.bannerTitle !== false;
  }

  get bannerTitle(): string {
    return typeof this.plugin.bannerTitle === 'string' && this.plugin.bannerTitle
      ? this.plugin.bannerTitle
      : this.plugin.packageName;
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
