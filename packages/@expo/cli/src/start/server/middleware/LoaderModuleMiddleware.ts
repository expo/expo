import { getConfig } from '@expo/config';
import { getRoutePathFromLoaderPath } from 'expo-router/build/loaders/utils';

import { ExpoMiddleware } from './ExpoMiddleware';
import { ServerNext, ServerRequest, ServerResponse } from './server.types';

const LOADER_MODULE_ENDPOINT = '/_expo/loaders';

/**
 * Middleware for serving loader data modules dynamically during development. This allows
 * client-side navigation to fetch loader data on-demand.
 *
 * In production, these modules are pre-generated as static files.
 */
export class LoaderModuleMiddleware extends ExpoMiddleware {
  constructor(
    protected projectRoot: string,
    private executeRouteLoaderAsync: (url: URL) => Promise<any>,
    private getDevServerUrl: () => string
  ) {
    super(projectRoot, [LOADER_MODULE_ENDPOINT]);
  }

  /**
   * Only handles a request if `req.pathname` begins with `/_expo/loaders/`
   */
  override shouldHandleRequest(req: ServerRequest): boolean {
    if (!req.url) return false;
    const { pathname } = new URL(req.url, 'http://localhost');

    if (!pathname.startsWith(`${LOADER_MODULE_ENDPOINT}/`)) {
      return false;
    }

    const { exp } = getConfig(this.projectRoot);
    return !!exp.extra?.router?.unstable_useServerDataLoaders;
  }

  async handleRequestAsync(
    req: ServerRequest,
    res: ServerResponse,
    next: ServerNext
  ): Promise<void> {
    if (!['GET', 'HEAD'].includes(req.method ?? '')) {
      return next();
    }

    const { pathname } = new URL(req.url!, 'http://localhost');

    try {
      const routePath = getRoutePathFromLoaderPath(pathname);

      const loaderData = await this.executeRouteLoaderAsync(
        new URL(routePath, this.getDevServerUrl())
      );

      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.statusCode = 200;
      res.end(`export default ${JSON.stringify(loaderData ?? {})}`);
    } catch (error) {
      console.error(`Failed to generate loader module for ${pathname}:`, error);
      res.statusCode = 500;
      res.end(`export default {}`);
    }
  }
}
