import './install';

import type { ExpoRoutesManifestV1, RouteInfo } from 'expo-router/build/routes-manifest';

import { ExpoRouterServerManifestV1FunctionRoute } from './types';

const debug =
  process?.env?.NODE_ENV === 'development'
    ? (require('debug')('expo:server') as typeof console.log)
    : () => {};

export function createRequestHandler({
  getRoutesManifest,
  getHtml,
  getApiRoute,
  logApiRouteExecutionError,
  handleApiRouteError,
}: {
  getHtml: (request: Request, route: RouteInfo<RegExp>) => Promise<string | Response | null>;
  getRoutesManifest: () => Promise<ExpoRoutesManifestV1<RegExp> | null>;
  getApiRoute: (route: RouteInfo<RegExp>) => Promise<any>;
  logApiRouteExecutionError: (error: Error) => void;
  handleApiRouteError: (error: Error) => Promise<Response>;
}) {
  return async function handler(request: Request): Promise<Response> {
    const manifest = await getRoutesManifest();
    if (!manifest) {
      // NOTE(@EvanBacon): Development error when Expo Router is not setup.
      // NOTE(@kitten): If the manifest is not found, we treat this as
      // an SSG deployment and do nothing
      return new Response('Not found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    return requestHandler(request, manifest);
  };

  async function requestHandler(incomingRequest: Request, manifest: ExpoRoutesManifestV1<RegExp>) {
    let request = incomingRequest;
    const url = new URL(request.url);

    let sanitizedPathname = url.pathname;

    debug('Request', sanitizedPathname);

    if (manifest.redirects) {
      for (const route of manifest.redirects) {
        if (!route.namedRegex.test(sanitizedPathname)) {
          continue;
        }

        if (route.methods && !route.methods.includes(request.method)) {
          continue;
        }

        const Location = getRedirectRewriteLocation(request, route);

        if (Location) {
          debug('Redirecting', Location);

          // Get the params
          return new Response(null, { status: route.permanent ? 308 : 307, headers: { Location } });
        }
      }
    }

    if (manifest.rewrites) {
      for (const route of manifest.rewrites) {
        if (!route.namedRegex.test(sanitizedPathname)) {
          continue;
        }

        if (route.methods && !route.methods.includes(request.method)) {
          continue;
        }

        const url = getRedirectRewriteLocation(request, route);
        request = new Request(new URL(url, new URL(request.url).origin), request);
        sanitizedPathname = new URL(request.url, 'http://expo.dev').pathname;
      }
    }

    if (request.method === 'GET' || request.method === 'HEAD') {
      // First test static routes
      for (const route of manifest.htmlRoutes) {
        if (!route.namedRegex.test(sanitizedPathname)) {
          continue;
        }

        // // Mutate to add the expoUrl object.
        updateRequestWithConfig(request, route);

        // serve a static file
        const contents = await getHtml(request, route);

        // TODO: What's the standard behavior for malformed projects?
        if (!contents) {
          return new Response('Not found', {
            status: 404,
            headers: { 'Content-Type': 'text/plain' },
          });
        } else if (contents instanceof Response) {
          return contents;
        }

        return new Response(contents, { status: 200, headers: { 'Content-Type': 'text/html' } });
      }
    }

    // Next, test API routes
    for (const route of manifest.apiRoutes) {
      if (!route.namedRegex.test(sanitizedPathname)) {
        continue;
      }

      let func: any;
      try {
        func = await getApiRoute(route);
      } catch (error) {
        if (error instanceof Error) {
          logApiRouteExecutionError(error);
        }
        return handleApiRouteError(error as Error);
      }

      if (func instanceof Response) {
        return func;
      }

      const routeHandler = func?.[request.method];
      if (!routeHandler) {
        return new Response('Method not allowed', {
          status: 405,
          headers: { 'Content-Type': 'text/plain' },
        });
      }

      // Mutate to add the expoUrl object.
      const params = updateRequestWithConfig(request, route);

      try {
        // TODO: Handle undefined
        return (await routeHandler(request, params)) as Response;
      } catch (error) {
        if (error instanceof Error) {
          logApiRouteExecutionError(error);
        }
        return handleApiRouteError(error as Error);
      }
    }

    // Finally, test 404 routes
    for (const route of manifest.notFoundRoutes) {
      if (!route.namedRegex.test(sanitizedPathname)) {
        continue;
      }

      // // Mutate to add the expoUrl object.
      updateRequestWithConfig(request, route);

      // serve a static file
      const contents = await getHtml(request, route);

      // TODO: What's the standard behavior for malformed projects?
      if (!contents) {
        return new Response('Not found', {
          status: 404,
          headers: { 'Content-Type': 'text/plain' },
        });
      } else if (contents instanceof Response) {
        return contents;
      }

      return new Response(contents, { status: 404, headers: { 'Content-Type': 'text/html' } });
    }

    // 404
    const response = new Response('Not found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' },
    });
    return response;
  }
}

function updateRequestWithConfig(
  request: Request,
  config: ExpoRouterServerManifestV1FunctionRoute
) {
  const params: Record<string, string> = {};
  const url = new URL(request.url);
  const match = config.namedRegex.exec(url.pathname);
  if (match?.groups) {
    for (const [key, value] of Object.entries(match.groups)) {
      const namedKey = config.routeKeys[key];
      params[namedKey] = value;
    }
  }

  return params;
}

/** Match `[page]` -> `page` or `[...group]` -> `...group` */
const dynamicNameRe = /^\[([^[\]]+?)\]$/;

function getRedirectRewriteLocation(request: Request, route: RouteInfo<RegExp>) {
  const params = updateRequestWithConfig(request, route);

  const urlSearchParams = new URL(request.url).searchParams;

  let location = route.page
    .split('/')
    .map((segment) => {
      let paramName = segment.match(dynamicNameRe)?.[1];
      if (!paramName) {
        return segment;
      } else if (paramName.startsWith('...')) {
        paramName = paramName.slice(3);
        const value = params[paramName];
        delete params[paramName];
        return value;
      } else {
        const value = params[paramName];
        delete params[paramName];
        return value?.split('/')[0];
      }
    })
    .join('/');

  if (Object.keys(params).length > 0 || urlSearchParams.size > 0) {
    location +=
      '?' +
      new URLSearchParams({
        ...params,
        ...Object.fromEntries(urlSearchParams.entries()),
      }).toString();
  }

  return location;
}
