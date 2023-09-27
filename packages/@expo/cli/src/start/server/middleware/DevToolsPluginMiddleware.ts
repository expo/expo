import assert from 'assert';
import { readFile } from 'fs/promises';
import path from 'path';

import { ExpoMiddleware } from './ExpoMiddleware';
import { ServerRequest, ServerResponse } from './server.types';
import DevToolsPluginManager, { DevToolsPluginEndpoint } from '../DevToolsPluginManager';

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
    const { pathname } = new URL(req.url ?? '/', `http://${req.headers.host}`);
    const pluginName = pathname.substring(DevToolsPluginEndpoint.length + 1).split('/')[0];
    if (!pluginName) {
      res.statusCode = 404;
      res.end();
      return;
    }
    const webpageRoot = await this.pluginManager.queryPluginWebpageRootAsync(pluginName);
    if (!webpageRoot) {
      res.statusCode = 404;
      res.end();
      return;
    }

    const staticFilePath = this.shouldServeStaticFile(pluginName, pathname);
    if (staticFilePath) {
      const content = (await readFile(path.join(webpageRoot, staticFilePath))).toString('utf-8');
      res.setHeader('Content-Type', DevToolsPluginMiddleware.getContentType(staticFilePath));
      res.end(content);
    } else {
      const content = (await readFile(path.join(webpageRoot, 'index.html'))).toString('utf-8');
      res.setHeader('Content-Type', 'text/html');
      res.end(content);
    }
  }

  private shouldServeStaticFile(pluginName: string, pathname: string): string | null {
    const staticRoots = [
      'static', // webpack
      'bundles', // metro
    ];
    for (const staticRoot of staticRoots) {
      const rootPath = `${DevToolsPluginEndpoint}/${pluginName}/${staticRoot}/`;
      if (pathname.startsWith(rootPath)) {
        const filePath = pathname.substring(rootPath.length);
        return path.join(staticRoot, filePath);
      }
    }
    return null;
  }

  private static getContentType(filePath: string): string {
    switch (path.extname(filePath)) {
      case '.svg':
        return 'image/svg+xml';
      case '.png':
        return 'image/png';
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.css':
        return 'text/css';
      case '.js':
        return 'application/javascript';
      case '.html':
        return 'text/html';
      default:
        return 'text/plain';
    }
  }
}
