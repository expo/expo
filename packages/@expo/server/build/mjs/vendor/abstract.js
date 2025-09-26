import { ImmutableRequest } from '../ImmutableRequest';
import { getRedirectRewriteLocation, isResponse, parseParams } from '../utils/matchers';
import { shouldRunMiddleware } from '../utils/middleware';
/** Internal errors class to indicate that the server has failed
 * @remarks
 * This should be thrown for unexpected errors, so they show up as crashes.
 * Typically malformed project structure, missing manifest, html or other files.
 */
export class ExpoError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ExpoError';
    }
    static isExpoError(error) {
        return !!error && error instanceof ExpoError;
    }
}
function noopBeforeResponse(responseInit, _route) {
    return responseInit;
}
export function createRequestHandler({ getRoutesManifest, getHtml, getApiRoute, handleRouteError, getMiddleware, beforeErrorResponse = noopBeforeResponse, beforeResponse = noopBeforeResponse, beforeHTMLResponse = noopBeforeResponse, beforeAPIResponse = noopBeforeResponse, }) {
    let manifest = null;
    return async function handler(request) {
        if (!manifest) {
            manifest = await getRoutesManifest();
        }
        return requestHandler(request, manifest);
    };
    async function requestHandler(incomingRequest, manifest) {
        if (!manifest) {
            // NOTE(@EvanBacon): Development error when Expo Router is not setup.
            // NOTE(@kitten): If the manifest is not found, we treat this as
            // an SSG deployment and do nothing
            return createResponse(null, null, 'Not found', {
                status: 404,
                headers: new Headers({
                    'Content-Type': 'text/plain',
                }),
            });
        }
        let request = incomingRequest;
        let url = new URL(request.url);
        if (manifest.middleware) {
            try {
                const middleware = await getMiddleware(manifest.middleware);
                if (shouldRunMiddleware(request, middleware)) {
                    const middlewareResponse = await middleware.default(new ImmutableRequest(request));
                    if (middlewareResponse instanceof Response) {
                        return middlewareResponse;
                    }
                    // If middleware returns undefined/void, continue to route matching
                }
            }
            catch (error) {
                // Shows RedBox in development
                return handleRouteError(error);
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
                }
                catch (error) {
                    // Shows RedBox in development
                    return handleRouteError(error);
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
            }
            catch (error) {
                // Shows RedBox in development
                return handleRouteError(error);
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
                }
                catch {
                    // NOTE(@krystofwoldrich): Should we show a dismissible RedBox in development?
                    // Handle missing/corrupted not found route files
                    continue;
                }
            }
        }
        // 404
        return createResponse(null, null, 'Not found', {
            status: 404,
            headers: new Headers({ 'Content-Type': 'text/plain' }),
        });
    }
    function createResponse(routeType = null, route, bodyInit, responseInit) {
        const originalStatus = responseInit.status;
        let callbackRoute;
        if (route && routeType) {
            route.type = routeType;
            callbackRoute = route;
        }
        else {
            callbackRoute = { type: null };
        }
        let modifiedResponseInit = responseInit;
        // Callback call order matters, general rule is to call more specific callbacks first.
        if (routeType === 'html') {
            modifiedResponseInit = beforeHTMLResponse(modifiedResponseInit, callbackRoute);
        }
        if (routeType === 'api') {
            modifiedResponseInit = beforeAPIResponse(modifiedResponseInit, callbackRoute);
        }
        // Second to last is error response callback
        if (originalStatus && originalStatus > 399) {
            modifiedResponseInit = beforeErrorResponse(modifiedResponseInit, callbackRoute);
        }
        // Generic before response callback last
        modifiedResponseInit = beforeResponse(modifiedResponseInit, callbackRoute);
        return new Response(bodyInit, modifiedResponseInit);
    }
    function createResponseFrom(routeType = null, route, response) {
        const modifiedResponseInit = {
            headers: new Headers(response.headers),
            status: response.status,
            statusText: response.statusText,
            cf: response.cf,
            webSocket: response.webSocket,
        };
        return createResponse(routeType, route, response.body, modifiedResponseInit);
    }
    async function respondNotFoundHTML(html, route) {
        if (typeof html === 'string') {
            return createResponse('notFoundHtml', route, html, {
                status: 404,
                headers: new Headers({
                    'Content-Type': 'text/html',
                }),
            });
        }
        if (isResponse(html)) {
            // Only used for development errors
            return html;
        }
        throw new ExpoError(`HTML route file ${route.page}.html could not be loaded`);
    }
    async function respondAPI(mod, request, route) {
        if (!mod || typeof mod !== 'object') {
            throw new ExpoError(`API route module ${route.page} could not be loaded`);
        }
        if (isResponse(mod)) {
            // Only used for development API route bundling errors
            return mod;
        }
        const handler = mod[request.method];
        if (!handler || typeof handler !== 'function') {
            return createResponse('notAllowedApi', route, 'Method not allowed', {
                status: 405,
                headers: new Headers({
                    'Content-Type': 'text/plain',
                }),
            });
        }
        const params = parseParams(request, route);
        const response = await handler(request, params);
        if (!isResponse(response)) {
            throw new ExpoError(`API route ${request.method} handler ${route.page} resolved to a non-Response result`);
        }
        return createResponseFrom('api', route, response);
    }
    function respondHTML(html, route) {
        if (typeof html === 'string') {
            return createResponse('html', route, html, {
                status: 200,
                headers: new Headers({
                    'Content-Type': 'text/html',
                }),
            });
        }
        if (isResponse(html)) {
            // Only used for development error responses
            return html;
        }
        throw new ExpoError(`HTML route file ${route.page}.html could not be loaded`);
    }
    function respondRedirect(url, request, route) {
        // NOTE(@krystofwoldrich): @expo/server would not redirect when location was empty,
        // it would keep searching for match and eventually return 404. Worker redirects to origin.
        const target = getRedirectRewriteLocation(url, request, route);
        let status;
        if (request.method === 'GET' || request.method === 'HEAD') {
            status = route.permanent ? 301 : 302;
        }
        else {
            status = route.permanent ? 308 : 307;
        }
        return Response.redirect(target, status);
    }
}
//# sourceMappingURL=abstract.js.map