export function isResponse(input) {
    return !!input && typeof input === 'object' && input instanceof Response;
}
export function parseParams(request, route) {
    const params = {};
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
export function getRedirectRewriteLocation(url, request, route) {
    const originalQueryParams = url.searchParams.entries();
    const params = parseParams(request, route);
    const target = route.page
        .split('/')
        .map((segment) => {
        let match;
        if ((match = matchDynamicName(segment))) {
            const value = params[match];
            delete params[match];
            return typeof value === 'string'
                ? value.split('/')[0] /* If we are redirecting from a catch-all route, we need to remove the extra segments */
                : (value ?? segment);
        }
        else if ((match = matchDeepDynamicRouteName(segment))) {
            const value = params[match];
            delete params[match];
            return value ?? segment;
        }
        else {
            return segment;
        }
    })
        .join('/');
    const targetUrl = new URL(target, url.origin);
    // NOTE: React Navigation doesn't differentiate between a path parameter
    // and a search parameter. We have to preserve leftover search parameters
    // to ensure we don't lose any intentional parameters with special meaning
    for (const key in params)
        targetUrl.searchParams.append(key, params[key]);
    // NOTE(@krystofwoldrich): Query matching is not supported at the moment.
    // Copy original query parameters to the target URL
    for (const [key, value] of originalQueryParams) {
        // NOTE(@krystofwoldrich): Params created from route overwrite existing (might be unexpected to the user)
        if (!targetUrl.searchParams.has(key)) {
            targetUrl.searchParams.append(key, value);
        }
    }
    return targetUrl;
}
/** Match `[page]` -> `page`
 * @privateRemarks Ported from `expo-router/src/matchers.tsx`
 */
export function matchDynamicName(name) {
    // Don't match `...` or `[` or `]` inside the brackets
    return name.match(/^\[([^[\](?:\.\.\.)]+?)\]$/)?.[1]; // eslint-disable-line no-useless-escape
}
/** Match `[...page]` -> `page`
 * @privateRemarks Ported from `expo-router/src/matchers.tsx`
 */
export function matchDeepDynamicRouteName(name) {
    return name.match(/^\[\.\.\.([^/]+?)\]$/)?.[1];
}
//# sourceMappingURL=utils.js.map