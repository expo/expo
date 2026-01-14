import { getConfig } from '@expo/config';
import { type RouteInfo } from 'expo-server/private';
import { Readable } from 'node:stream';

import { ExpoMiddleware } from './ExpoMiddleware';
import { ServerNext, ServerRequest, ServerResponse } from './server.types';
import { fetchManifest } from '../metro/fetchRouterManifest';

const LOADER_MODULE_ENDPOINT = '/_expo/loaders';

/**
 * Middleware for serving loader data modules dynamically during development. This allows
 * client-side navigation to fetch loader data on-demand.
 *
 * In production, these modules are pre-generated as static files.
 */
export class DataLoaderModuleMiddleware extends ExpoMiddleware {
  constructor(
    protected projectRoot: string,
    protected appDir: string,
    private executeServerDataLoaderAsync: (
      url: URL,
      route: RouteInfo<RegExp>,
      request?: Request
    ) => Promise<{ data: unknown } | undefined>,
    private getDevServerUrl: () => string
  ) {
    super(projectRoot, [LOADER_MODULE_ENDPOINT]);
  }

  /**
   * Only handles a request if `req.pathname` begins with `/_expo/loaders/`.
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

    const manifest = await fetchManifest(this.projectRoot, {
      appDir: this.appDir,
    });

    const { pathname } = new URL(req.url!, 'http://localhost');

    try {
      const routePath = pathname.replace('/_expo/loaders', '').replace('/index', '/') || '/';

      const matchingRoute = manifest?.htmlRoutes.find((route) => {
        return route.namedRegex.test(routePath);
      });

      if (!matchingRoute) {
        throw new Error(`No matching route for ${routePath}`);
      }

      const { exp } = getConfig(this.projectRoot);
      const isSSREnabled =
        exp.web?.output === 'server' && exp.extra?.router?.unstable_useServerRendering === true;

      const routeUrl = new URL(routePath, this.getDevServerUrl());
      const loaderRequest = isSSREnabled ? convertServerRequest(req, res, routeUrl) : undefined;

      const loaderResult = await this.executeServerDataLoaderAsync(
        routeUrl,
        matchingRoute,
        loaderRequest
      );

      if (!loaderResult) {
        res.statusCode = 404;
        res.end();
        return;
      }

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.statusCode = 200;
      res.end(JSON.stringify(loaderResult.data));
    } catch (error) {
      console.error(`Failed to generate loader module for ${pathname}:`, error);
      res.statusCode = 500;
      res.end();
    }
  }
}

/**
 * Converts a Node.js `ServerRequest` to a standard web `Request` object.
 * @see import('expo-server/src/vendor/http.ts').convertRequest
 */
function convertServerRequest(req: ServerRequest, res: ServerResponse, url: URL): Request {
  const controller = new AbortController();
  res.on('close', () => controller.abort());

  const init: RequestInit = {
    method: req.method,
    headers: convertRawHeaders(req.rawHeaders ?? []),
    signal: controller.signal,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = Readable.toWeb(req) as ReadableStream;
    // NOTE(@hassankhan): Casting to `any` to work around typing issue
    (init as any).duplex = 'half';
  }

  return new Request(url.href, init);
}

function convertRawHeaders(requestHeaders: readonly string[]): Headers {
  const headers = new Headers();
  for (let index = 0; index < requestHeaders.length; index += 2) {
    headers.append(requestHeaders[index], requestHeaders[index + 1]);
  }
  return headers;
}
