import './install';

import fs from 'node:fs';
import path from 'node:path';

import { ImmutableRequest } from './ImmutableRequest';
import { ExpoError } from './error';
import { Manifest, Middleware, MiddlewareFunction, Route } from './types';
import { getRedirectRewriteLocation, isResponse, parseParams } from './utils';

export function createRequestHandler({
  getRoutesManifest,
  getHtml,
  getApiRoute,
  handleRouteError,
  getMiddleware = async (middleware) => {
    // TODO: pass dist
    const filePath = path.join('.', middleware.file);

    return loadServerModule(filePath);
  },
}: {
  getHtml: (request: Request, route: Route) => Promise<string | Response | null>;
  getRoutesManifest: () => Promise<Manifest | null>;
  getApiRoute: (route: Route) => Promise<any>;
  getMiddleware?: (route: Middleware) => Promise<any>;
  handleRouteError: (error: Error) => Promise<Response>;
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

  async function requestHandler(incomingRequest: Request, manifest: Manifest) {
    let request = incomingRequest;
    let url = new URL(request.url);

    if (manifest.middleware && shouldRunMiddleware(request, manifest.middleware)) {
      try {
        const middlewareModule = await getMiddleware(manifest.middleware);
        if (middlewareModule?.default) {
          const middlewareFn = middlewareModule.default as MiddlewareFunction;
          const middlewareResponse = await middlewareFn(new ImmutableRequest(request));
          if (middlewareResponse instanceof Response) {
            return middlewareResponse;
          }

          // If middleware returns undefined/void, continue to route matching
        }
      } catch (error) {
        // Shows RedBox in development
        return handleRouteError(error as Error);
      }
    }

    if (manifest.redirects) {
      for (const route of manifest.redirects) {
        if (!route.namedRegex.test(url.pathname)) {
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
        if (!route.namedRegex.test(url.pathname)) {
          continue;
        }

        if (route.methods && !route.methods.includes(request.method)) {
          continue;
        }

        // Replace URL and Request with rewrite target
        url = getRedirectRewriteLocation(url, request, route);
        request = new Request(url, request);
      }
    }

    // First, test static routes
    if (request.method === 'GET' || request.method === 'HEAD') {
      for (const route of manifest.htmlRoutes) {
        if (!route.namedRegex.test(url.pathname)) {
          continue;
        }

        try {
          const html = await getHtml(request, route);
          return respondHTML(html, route);
        } catch (error) {
          // Shows RedBox in development
          return handleRouteError(error as Error);
        }
      }
    }

    // Next, test API routes
    for (const route of manifest.apiRoutes) {
      if (!route.namedRegex.test(url.pathname)) {
        continue;
      }

      try {
        const mod = await getApiRoute(route);
        return await respondAPI(mod, request, route);
      } catch (error) {
        // Shows RedBox in development
        return handleRouteError(error as Error);
      }
    }

    // Finally, test 404 routes
    if (request.method === 'GET' || request.method === 'HEAD') {
      for (const route of manifest.notFoundRoutes) {
        if (!route.namedRegex.test(url.pathname)) {
          continue;
        }

        try {
          const contents = await getHtml(request, route);
          return respondNotFoundHTML(contents, route);
        } catch {
          // NOTE(@krystofwoldrich): Should we show a dismissible RedBox in development?
          // Handle missing/corrupted not found route files
          continue;
        }
      }
    }

    // 404
    return new Response('Not found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

async function respondNotFoundHTML(
  html: string | Response | null,
  route: Route
): Promise<Response> {
  if (typeof html === 'string') {
    return new Response(html, {
      status: 404,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }

  if (isResponse(html)) {
    // Only used for development errors
    return html;
  }

  throw new ExpoError(`HTML route file ${route.page}.html could not be loaded`);
}

async function respondAPI(mod: any, request: Request, route: Route): Promise<Response> {
  if (!mod || typeof mod !== 'object') {
    throw new ExpoError(`API route module ${route.page} could not be loaded`);
  }

  if (isResponse(mod)) {
    // Only used for development API route bundling errors
    return mod;
  }

  const handler = mod[request.method];
  if (!handler || typeof handler !== 'function') {
    return new Response('Method not allowed', {
      status: 405,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }

  const params = parseParams(request, route);
  const response = await handler(request, params);
  if (!isResponse(response)) {
    throw new ExpoError(
      `API route ${request.method} handler ${route.page} resolved to a non-Response result`
    );
  }

  return response;
}

function respondHTML(html: string | Response | null, route: Route): Response {
  if (typeof html === 'string') {
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });
  }

  if (isResponse(html)) {
    // Only used for development error responses
    return html;
  }

  throw new ExpoError(`HTML route file ${route.page}.html could not be loaded`);
}

function respondRedirect(url: URL, request: Request, route: Route): Response {
  // NOTE(@krystofwoldrich): @expo/server would not redirect when location was empty,
  // it would keep searching for match and eventually return 404. Worker redirects to origin.
  const target = getRedirectRewriteLocation(url, request, route);

  let status: number;
  if (request.method === 'GET' || request.method === 'HEAD') {
    status = route.permanent ? 301 : 302;
  } else {
    status = route.permanent ? 308 : 307;
  }

  return Response.redirect(target, status);
}

function loadServerModule(filePath: string) {
  // TODO: What's the standard behavior for malformed projects?
  if (!fs.existsSync(filePath)) {
    return null;
  }

  if (/\.c?js$/.test(filePath)) {
    return require(filePath);
  }
  return import(filePath);
}

/**
 * Determines whether middleware should run for a given request based on matcher configuration.
 */
function shouldRunMiddleware(request: Request, middleware: Middleware): boolean {
  // TODO(@hassankhan): Implement pattern matching for middleware
  return true;

  // No matcher means middleware runs on all requests
  // if (!middleware.matcher) {
  //   return true;
  // }
}
