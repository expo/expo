import './install';

import type { ExpoRoutesManifestV1, RouteInfo } from 'expo-router/build/routes-manifest';

import { ExpoRouterServerManifestV1FunctionRoute } from './types';

const isDevelopment = process?.env?.NODE_ENV === 'development';

const debug =
  // TODO: Use WinterCG compatible check
  process?.env?.NODE_ENV === 'development'
    ? (require('debug')('expo:server') as typeof console.log)
    : () => {};

const HTML_CACHE_CONTROL = 's-maxage=3600';

const _importCache = new Map();
async function importCached(target: string): Promise<any> {
  let result = _importCache.get(target);
  if (!result) {
    try {
      result = { type: 'success', value: await import(target) };
    } catch (error) {
      result = { type: 'error', value: error };
    }
    _importCache.set(target, result);
  }

  if (result.type === 'success') {
    return result.value;
  } else {
    throw result.value;
  }
}

async function importWithIndexFallback(target: string, filetype = '') {
  const INDEX_PATH = '/index';
  try {
    return await importCached(target + filetype);
  } catch (error) {
    if (target.endsWith(INDEX_PATH) && target.length > INDEX_PATH.length) {
      return await importWithIndexFallback(target.slice(0, -INDEX_PATH.length), filetype);
    }
    throw error;
  }
}

async function getRoutesManifest(dist = '.'): Promise<ExpoRoutesManifestV1<RegExp> | null> {
  try {
    // TODO: What path should we support here? should we include pathe or use URL to join the paths?
    const routesMod = await import(`${dist}/_expo/routes.json`);
    // TODO: JSON Schema for validation
    const routesManifest: ExpoRoutesManifestV1 = JSON.parse(routesMod.default);
    return {
      ...routesManifest,
      notFoundRoutes: routesManifest.notFoundRoutes.map((value) => ({
        ...value,
        namedRegex: new RegExp(value.namedRegex),
      })),
      apiRoutes: routesManifest.apiRoutes.map((value) => ({
        ...value,
        namedRegex: new RegExp(value.namedRegex),
      })),
      htmlRoutes: routesManifest.htmlRoutes.map((value) => ({
        ...value,
        namedRegex: new RegExp(value.namedRegex),
      })),
      redirects: routesManifest.redirects?.map((value) => ({
        ...value,
        namedRegex: new RegExp(value.namedRegex),
      })),
      rewrites: routesManifest.rewrites?.map((value) => ({
        ...value,
        namedRegex: new RegExp(value.namedRegex),
      })),
    };
  } catch (error) {
    debug('Error loading routes manifest:', error);
    return null;
  }
}

// TODO: Reuse this for dev as well
export function createRequestHandler(
  distFolder: string,
  {
    getRoutesManifest: getInternalRoutesManifest = getRoutesManifest,
    getHtml = async (_request, route) => {
      const html = (await importWithIndexFallback(`${distFolder}/${route.page}`, '.html')).default;
      return typeof html === 'string' ? html : null;
    },
    getApiRoute = async (route) => {
      const filePath = `${distFolder}/${route.file}`;
      debug(`Handling API route: ${route.page}: ${filePath}`);

      // TODO: Should catch errors here?
      // TODO: Production worker uses `import` only
      if (/\.c?js$/.test(filePath)) {
        return require(filePath);
      }
      return import(filePath);
    },
    logApiRouteExecutionError = (error: Error) => {
      console.error(error);
    },
    handleApiRouteError = async (error: Error) => {
      if ('statusCode' in error && typeof error.statusCode === 'number') {
        return new Response(error.message, {
          status: error.statusCode,
          headers: { 'Content-Type': 'text/plain' },
        });
      }
      return new Response('Internal server error', {
        status: 500,
        headers: { 'Content-Type': 'text/plain' },
      });
    },
  }: {
    // TODO: Remove Response return type, currently used for development error responses directly from Metro
    getHtml?: (request: Request, route: RouteInfo<RegExp>) => Promise<string | Response | null>;
    getRoutesManifest?: (distFolder: string) => Promise<ExpoRoutesManifestV1<RegExp> | null>;
    getApiRoute?: (route: RouteInfo<RegExp>) => Promise<any>;
    logApiRouteExecutionError?: (error: Error) => void;
    handleApiRouteError?: (error: Error) => Promise<Response>;
  } = {}
) {
  let routesManifest: ExpoRoutesManifestV1<RegExp> | undefined;

  const getRoutesManifestCached = async () => {
    let manifest: ExpoRoutesManifestV1<RegExp> | null = null;
    if (getInternalRoutesManifest) {
      // Development
      manifest = await getInternalRoutesManifest(distFolder);
    } else if (!routesManifest) {
      // Production
      manifest = await getRoutesManifest(distFolder);
    }

    if (manifest) {
      routesManifest = manifest;
    }

    return routesManifest;
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

  return async function handler(request: Request): Promise<Response> {
    const manifest = await getRoutesManifestCached();
    if (!manifest) {
      // NOTE(@EvanBacon): Development error when Expo Router is not setup.
      // NOTE(@kitten): If the manifest is not found, we treat this as
      // an SSG deployment and do nothing
      return new Response('Not found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain',
          ...(isDevelopment ? {} : { 'Cache-Control': HTML_CACHE_CONTROL }),
        },
      });
    }

    return requestHandler(request, manifest);
  };
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
