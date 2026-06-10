import assert from 'assert';
import { convertRequest, respond } from 'expo-server/adapter/http';
import type * as http from 'http';
import send from 'send';

import { ExpoMiddleware } from './ExpoMiddleware';
import type { ServerRequest, ServerResponse } from './server.types';
import type { DevToolsPlugin } from '../DevToolsPlugin';
import type DevToolsPluginManager from '../DevToolsPluginManager';
import { DevToolsPluginEndpoint } from '../DevToolsPluginManager';

const debug = require('debug')('expo:start:server:middleware:devToolsPlugin') as typeof console.log;

export { DevToolsPluginEndpoint };

export class DevToolsPluginMiddleware extends ExpoMiddleware {
  constructor(
    projectRoot: string,
    private readonly pluginManager: DevToolsPluginManager
  ) {
    super(projectRoot, [DevToolsPluginEndpoint]);
  }

  override shouldHandleRequest(req: ServerRequest): boolean {
    if (!req.url?.startsWith(DevToolsPluginEndpoint)) {
      return false;
    }
    return true;
  }

  async handleRequestAsync(req: ServerRequest, res: ServerResponse): Promise<void> {
    assert(req.headers.host, 'Request headers must include host');
    const { pathname, search } = new URL(req.url ?? '/', `http://${req.headers.host}`);
    const pluginName = this.queryPossiblePluginName(
      pathname.substring(DevToolsPluginEndpoint.length + 1)
    );
    const plugin = await this.pluginManager.queryPluginAsync(pluginName);
    if (!plugin) {
      res.statusCode = 404;
      res.end();
      return;
    }

    const pathInPluginRoot =
      pathname.substring(DevToolsPluginEndpoint.length + pluginName.length + 1) || '/';

    if (plugin.serverEntryPoint != null) {
      const handled = await this.handleWithPluginServerAsync(
        plugin,
        req,
        res,
        `${pathInPluginRoot}${search}`
      );
      if (handled) {
        return;
      }
    }

    if (plugin.webpageRoot != null) {
      send(req, pathInPluginRoot, { root: plugin.webpageRoot }).pipe(res);
      return;
    }

    res.statusCode = 404;
    res.end();
  }

  /**
   * Passes the request to the plugin's `serverEntryPoint` fetch handler with the plugin
   * endpoint prefix stripped from the URL. Returns false when the handler returns no
   * response, so the request falls through to static `webpageRoot` serving.
   */
  private async handleWithPluginServerAsync(
    plugin: DevToolsPlugin,
    req: ServerRequest,
    res: ServerResponse,
    urlInPluginRoot: string
  ): Promise<boolean> {
    const originalUrl = req.url;
    try {
      req.url = urlInPluginRoot;
      const request = convertRequest(req as http.IncomingMessage, res as http.ServerResponse);
      const response = await plugin.requestHandler?.(request);
      if (response == null) {
        return false;
      }
      await respond(res as http.ServerResponse, response, { signal: request.signal });
      return true;
    } catch (error: any) {
      debug('DevTools plugin server request failed: %O', error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain');
      res.end(
        `The DevTools plugin "${plugin.packageName}" failed to handle the request to "${urlInPluginRoot}": ` +
          `${error?.message ?? error}. This is likely a bug in the plugin's server entry point ` +
          `(${plugin.serverEntryPoint}); report it to the plugin author.`
      );
      return true;
    } finally {
      req.url = originalUrl;
    }
  }

  private queryPossiblePluginName(pathname: string): string {
    const parts = pathname.split('/');
    if (parts[0]![0] === '@' && parts.length > 1) {
      // Scoped package name
      return `${parts[0]}/${parts[1]}`;
    }
    return parts[0]!;
  }
}
