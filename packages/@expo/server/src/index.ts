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
  // TODO: Remove Response return type, currently used for development error responses directly from Metro
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

        return respondRedirect(url, request, route);
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

        const location = getRedirectRewriteLocation(request, route);
        const rewriteUrl = new URL(location, url.origin);
        request = new Request(rewriteUrl, request);
        sanitizedPathname = rewriteUrl.pathname;
      }
    }

    // First, test static routes
    if (request.method === 'GET' || request.method === 'HEAD') {
      for (const route of manifest.htmlRoutes) {
        if (!route.namedRegex.test(sanitizedPathname)) {
          continue;
        }

        const html = await getHtml(request, route);
        return respondHTML(html);
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

      const params = parseParams(request, route);

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

function respondHTML(html: string | Response | null): Response {
  if (typeof html === 'string') {
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }

  if (isResponse(html)) {
    // TODO: Might change, this is only used for development error responses
    return html;
  }

  // TODO: What's the standard behavior for malformed projects?
  // NOTE(@krystofwoldrich): Worker throws -> throw new ExpoError(`HTML route file ${route.page}.html could not be loaded`);
  return new Response('Not found', {
    status: 404,
    headers: { 'Content-Type': 'text/plain' },
  });
}

function respondRedirect(url: URL, request: Request, route: RouteInfo<RegExp>): Response {
  // NOTE(@krystofwoldrich): @expo/server would not redirect when location was empty,
  // it would keep searching for match and eventually return 404.
  // Worker redirects to origin.
  const location = getRedirectRewriteLocation(request, route);
  const target = new URL(location, url.origin).toString();

  let status: number;
  if (request.method === 'GET' || request.method === 'HEAD') {
    status = route.permanent ? 301 : 302;
  } else {
    status = route.permanent ? 308 : 307;
  }

  debug('Redirecting', status, target);
  return Response.redirect(target, status);
}

export function getRedirectRewriteLocation(request: Request, route: RouteInfo<RegExp>) {
  const params = parseParams(request, route);

  const urlSearchParams = new URL(request.url).searchParams;

  let location = route.page
    .split('/')
    .map((segment) => {
      let paramName = matchDynamicName(segment);
      if (!paramName) {
        return segment;
      } else if (paramName.startsWith('...')) {
        paramName = paramName.slice(3);
        const value = params[paramName];
        delete params[paramName];
        return value ?? segment;
      } else {
        const value = params[paramName];
        delete params[paramName];
        // If we are redirecting from a catch-all route, we need to remove the extra segments
        // e.g. `/files/[...path]` -> `/dirs/[name]`, `/files/home/name.txt` -> `/dirs/home`
        return value?.split('/')[0] ?? segment;
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

function parseParams(
  request: Request,
  route: ExpoRouterServerManifestV1FunctionRoute
): Record<string, string> {
  const params: Record<string, string> = {};
  const { pathname } = new URL(request.url);
  const match = route.namedRegex.exec(pathname);
  if (match?.groups) {
    for (const [key, value] of Object.entries(match.groups)) {
      const namedKey = route.routeKeys[key];
      params[namedKey] = value;
    }
  }
  return params;
}

/** Match `[page]` -> `page` or `[...group]` -> `...group` */
function matchDynamicName(name: string): string | undefined {
  return name.match(/^\[([^[\]]+?)\]$/)?.[1];
}

function isResponse(input: unknown): input is Response {
  return !!input && typeof input === 'object' && input instanceof Response;
}
