import assert from 'assert';
import send from 'send';

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
    const pluginName = this.queryPossiblePluginName(
      pathname.substring(DevToolsPluginEndpoint.length + 1)
    );
    const webpageRoot = await this.pluginManager.queryPluginWebpageRootAsync(pluginName);
    if (!webpageRoot) {
      res.statusCode = 404;
      res.end();
      return;
    }

    const pathInPluginRoot =
      pathname.substring(DevToolsPluginEndpoint.length + pluginName.length + 1) || '/';
    send(req, pathInPluginRoot, { root: webpageRoot }).pipe(res);
  }

  private queryPossiblePluginName(pathname: string): string {
    const parts = pathname.split('/');
    if (parts[0][0] === '@' && parts.length > 1) {
      // Scoped package name
      return `${parts[0]}/${parts[1]}`;
    }
    return parts[0];
  }
}
