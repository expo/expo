import type { Route } from '../manifest';

export function isResponse(input: unknown): input is Response {
  return !!input && typeof input === 'object' && input instanceof Response;
}

export function parseParams(request: Request, route: Route): Record<string, string> {
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

export function getRedirectRewriteLocation(url: URL, request: Request, route: Route): string {
  const originalQueryParams = url.searchParams.entries();
  const params = parseParams(request, route);
  // Externality is determined from the *unsubstituted* `route.page` so a
  // substituted catch-all that happens to contain `//host/...` cannot turn an
  // internal redirect into an absolute external one.
  const routePageIsExternal = isAbsoluteHttpUrl(route.page);
  const target = route.page
    .split('/')
    .map((segment) => {
      let match: string | undefined;
      if ((match = matchDynamicName(segment))) {
        const value = params[match];
        delete params[match];
        const resolved =
          typeof value === 'string'
            ? value.split(
                '/'
              )[0] /* If we are redirecting from a catch-all route, we need to remove the extra segments */
            : (value ?? segment);
        return routePageIsExternal ? resolved : stripLeadingSlashes(resolved);
      } else if ((match = matchDeepDynamicRouteName(segment))) {
        const value = params[match];
        delete params[match];
        const resolved = value ?? segment;
        return routePageIsExternal ? resolved : stripLeadingSlashes(resolved);
      } else {
        return segment;
      }
    })
    .join('/');
  const targetUrl = new URL(target, 'http://localhost');

  // NOTE: React Navigation doesn't differentiate between a path parameter
  // and a search parameter. We have to preserve leftover search parameters
  // to ensure we don't lose any intentional parameters with special meaning
  for (const key in params) targetUrl.searchParams.append(key, params[key]);

  // NOTE(@krystofwoldrich): Query matching is not supported at the moment.
  // Copy original query parameters to the target URL
  for (const [key, value] of originalQueryParams) {
    // NOTE(@krystofwoldrich): Params created from route overwrite existing (might be unexpected to the user)
    if (!targetUrl.searchParams.has(key)) {
      targetUrl.searchParams.append(key, value);
    }
  }

  // Internal routes must never escape to an external host, even if some
  // substitution path slipped through the sanitization above.
  if (!routePageIsExternal) {
    return targetUrl.pathname.replace(/^\/+/, '/') + targetUrl.search;
  }
  return targetUrl.hostname === 'localhost'
    ? targetUrl.pathname + targetUrl.search
    : targetUrl.toString();
}

function isAbsoluteHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function stripLeadingSlashes<T>(value: T): T {
  return typeof value === 'string' ? ((value as string).replace(/^\/+/, '') as T) : value;
}

/** Match `[page]` -> `page`
 * @privateRemarks Ported from `expo-router/src/matchers.tsx`
 */
export function matchDynamicName(name: string): string | undefined {
  // Don't match `...` or `[` or `]` inside the brackets
  return name.match(/^\[([^[\](?:\.\.\.)]+?)\]$/)?.[1]; // eslint-disable-line no-useless-escape
}

/** Match `[...page]` -> `page`
 * @privateRemarks Ported from `expo-router/src/matchers.tsx`
 */
export function matchDeepDynamicRouteName(name: string): string | undefined {
  return name.match(/^\[\.\.\.([^/]+?)\]$/)?.[1];
}
