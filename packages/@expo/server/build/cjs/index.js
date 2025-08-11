"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpoError = void 0;
exports.createRequestHandler = createRequestHandler;
const ImmutableRequest_1 = require("./ImmutableRequest");
const error_1 = require("./error");
const utils_1 = require("./utils");
var error_2 = require("./error");
Object.defineProperty(exports, "ExpoError", { enumerable: true, get: function () { return error_2.ExpoError; } });
function noopBeforeResponse(_route, responseInit) {
    return responseInit;
}
function createRequestHandler({ getRoutesManifest, getHtml, getApiRoute, handleRouteError, getMiddleware, beforeErrorResponse = noopBeforeResponse, beforeResponse = noopBeforeResponse, beforeHTMLResponse = noopBeforeResponse, beforeAPIResponse = noopBeforeResponse, }) {
    return async function handler(request) {
        const manifest = await getRoutesManifest();
        return requestHandler(request, manifest);
    };
    async function requestHandler(incomingRequest, manifest) {
        if (!manifest) {
            // NOTE(@EvanBacon): Development error when Expo Router is not setup.
            // NOTE(@kitten): If the manifest is not found, we treat this as
            // an SSG deployment and do nothing
            return createResponse(null, 'Not found', {
                status: 404,
                headers: {
                    'Content-Type': 'text/plain',
                },
            });
        }
        let request = incomingRequest;
        let url = new URL(request.url);
        if (manifest.middleware && shouldRunMiddleware(request, manifest.middleware)) {
            try {
                const middlewareModule = await getMiddleware(manifest.middleware);
                if (middlewareModule?.default) {
                    const middlewareFn = middlewareModule.default;
                    const middlewareResponse = await middlewareFn(new ImmutableRequest_1.ImmutableRequest(request));
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
                url = (0, utils_1.getRedirectRewriteLocation)(url, request, route);
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
        return createResponse(null, 'Not found', {
            status: 404,
            headers: { 'Content-Type': 'text/plain' },
        });
    }
    function createResponse(route, bodyInit, responseInit, routeType = null) {
        const originalStatus = responseInit.status;
        let modifiedResponseInit = responseInit;
        // Callback call order matters, general rule is to call more specific callbacks first.
        if (routeType === 'html') {
            modifiedResponseInit = beforeHTMLResponse(route, modifiedResponseInit);
        }
        if (routeType === 'api') {
            modifiedResponseInit = beforeAPIResponse(route, modifiedResponseInit);
        }
        // Second to last is error response callback
        if (originalStatus && originalStatus > 399) {
            modifiedResponseInit = beforeErrorResponse(route, modifiedResponseInit);
        }
        // Generic before response callback last
        modifiedResponseInit = beforeResponse(route, modifiedResponseInit);
        return new Response(bodyInit, modifiedResponseInit);
    }
    async function respondNotFoundHTML(html, route) {
        if (typeof html === 'string') {
            return createResponse(route, html, {
                status: 404,
                headers: {
                    'Content-Type': 'text/html',
                },
            });
        }
        if ((0, utils_1.isResponse)(html)) {
            // Only used for development errors
            return html;
        }
        throw new error_1.ExpoError(`HTML route file ${route.page}.html could not be loaded`);
    }
    async function respondAPI(mod, request, route) {
        if (!mod || typeof mod !== 'object') {
            throw new error_1.ExpoError(`API route module ${route.page} could not be loaded`);
        }
        if ((0, utils_1.isResponse)(mod)) {
            // Only used for development API route bundling errors
            return mod;
        }
        const handler = mod[request.method];
        if (!handler || typeof handler !== 'function') {
            return createResponse(route, 'Method not allowed', {
                status: 405,
                headers: {
                    'Content-Type': 'text/plain',
                },
            }, 'api');
        }
        const params = (0, utils_1.parseParams)(request, route);
        const response = await handler(request, params);
        if (!(0, utils_1.isResponse)(response)) {
            throw new error_1.ExpoError(`API route ${request.method} handler ${route.page} resolved to a non-Response result`);
        }
        return response;
    }
    function respondHTML(html, route) {
        if (typeof html === 'string') {
            return createResponse(route, html, {
                status: 200,
                headers: {
                    'Content-Type': 'text/html',
                },
            }, 'html');
        }
        if ((0, utils_1.isResponse)(html)) {
            // Only used for development error responses
            return html;
        }
        throw new error_1.ExpoError(`HTML route file ${route.page}.html could not be loaded`);
    }
    function respondRedirect(url, request, route) {
        // NOTE(@krystofwoldrich): @expo/server would not redirect when location was empty,
        // it would keep searching for match and eventually return 404. Worker redirects to origin.
        const target = (0, utils_1.getRedirectRewriteLocation)(url, request, route);
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
/**
 * Determines whether middleware should run for a given request based on matcher configuration.
 */
function shouldRunMiddleware(request, middleware) {
    // TODO(@hassankhan): Implement pattern matching for middleware
    return true;
    // No matcher means middleware runs on all requests
    // if (!middleware.matcher) {
    //   return true;
    // }
}
//# sourceMappingURL=index.js.map