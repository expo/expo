"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoutesManifest = getRoutesManifest;
exports.createRequestHandler = createRequestHandler;
exports.getRedirectRewriteLocation = getRedirectRewriteLocation;
require("./install");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const error_1 = require("./error");
const debug = process.env.NODE_ENV === 'development'
    ? require('debug')('expo:server')
    : () => { };
function getProcessedManifest(path) {
    // TODO: JSON Schema for validation
    const routesManifest = JSON.parse(node_fs_1.default.readFileSync(path, 'utf-8'));
    const parsed = {
        ...routesManifest,
        notFoundRoutes: routesManifest.notFoundRoutes.map((value) => {
            return { ...value, namedRegex: new RegExp(value.namedRegex) };
        }),
        apiRoutes: routesManifest.apiRoutes.map((value) => {
            return { ...value, namedRegex: new RegExp(value.namedRegex) };
        }),
        htmlRoutes: routesManifest.htmlRoutes.map((value) => {
            return { ...value, namedRegex: new RegExp(value.namedRegex) };
        }),
        redirects: routesManifest.redirects?.map((value) => {
            return { ...value, namedRegex: new RegExp(value.namedRegex) };
        }),
        rewrites: routesManifest.rewrites?.map((value) => {
            return { ...value, namedRegex: new RegExp(value.namedRegex) };
        }),
    };
    return parsed;
}
function getRoutesManifest(distFolder) {
    return getProcessedManifest(node_path_1.default.join(distFolder, '_expo/routes.json'));
}
function createRequestHandler(distFolder, { getRoutesManifest: getInternalRoutesManifest, getHtml = async (_request, route) => {
    // Serve a static file by exact route name
    const filePath = node_path_1.default.join(distFolder, route.page + '.html');
    if (node_fs_1.default.existsSync(filePath)) {
        return node_fs_1.default.readFileSync(filePath, 'utf-8');
    }
    // Serve a static file by route name with hoisted index
    // See: https://github.com/expo/expo/pull/27935
    const hoistedFilePath = route.page.match(/\/index$/)
        ? node_path_1.default.join(distFolder, route.page.replace(/\/index$/, '') + '.html')
        : null;
    if (hoistedFilePath && node_fs_1.default.existsSync(hoistedFilePath)) {
        return node_fs_1.default.readFileSync(hoistedFilePath, 'utf-8');
    }
    return null;
}, getApiRoute = async (route) => {
    const filePath = node_path_1.default.join(distFolder, route.file);
    debug(`Handling API route: ${route.page}: ${filePath}`);
    // TODO: What's the standard behavior for malformed projects?
    if (!node_fs_1.default.existsSync(filePath)) {
        return null;
    }
    if (/\.c?js$/.test(filePath)) {
        return require(filePath);
    }
    return import(filePath);
}, handleRouteError = async (error) => {
    // In production the server should handle unexpected errors
    throw error;
}, } = {}) {
    let routesManifest;
    const getRoutesManifestCached = async () => {
        let manifest = null;
        if (getInternalRoutesManifest) {
            // Only used for development by the dev server
            manifest = await getInternalRoutesManifest(distFolder);
        }
        else if (!routesManifest) {
            // Production
            manifest = await getRoutesManifest(distFolder);
        }
        if (manifest) {
            routesManifest = manifest;
        }
        return routesManifest;
    };
    async function requestHandler(incomingRequest, manifest) {
        let request = incomingRequest;
        let url = new URL(request.url);
        debug('Request', url.pathname);
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
        return new Response('Not found', {
            status: 404,
            headers: { 'Content-Type': 'text/plain' },
        });
    }
    return async function handler(request) {
        const manifest = await getRoutesManifestCached();
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
}
async function respondNotFoundHTML(html, route) {
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
    throw new error_1.ExpoError(`HTML route file ${route.page}.html could not be loaded`);
}
async function respondAPI(mod, request, route) {
    if (!mod || typeof mod !== 'object') {
        throw new error_1.ExpoError(`API route module ${route.page} could not be loaded`);
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
        throw new error_1.ExpoError(`API route ${request.method} handler ${route.page} resolved to a non-Response result`);
    }
    return response;
}
function respondHTML(html, route) {
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
    throw new error_1.ExpoError(`HTML route file ${route.page}.html could not be loaded`);
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
    debug('Redirecting', status, target);
    return Response.redirect(target, status);
}
function getRedirectRewriteLocation(url, request, route) {
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
    return targetUrl;
}
function parseParams(request, route) {
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
/** Match `[page]` -> `page`
 * @privateRemarks Ported from `expo-router/src/matchers.tsx`
 */
function matchDynamicName(name) {
    // Don't match `...` or `[` or `]` inside the brackets
    return name.match(/^\[([^[\](?:\.\.\.)]+?)\]$/)?.[1];
}
/** Match `[...page]` -> `page`
 * @privateRemarks Ported from `expo-router/src/matchers.tsx`
 */
function matchDeepDynamicRouteName(name) {
    return name.match(/^\[\.\.\.([^/]+?)\]$/)?.[1];
}
function isResponse(input) {
    return !!input && typeof input === 'object' && input instanceof Response;
}
//# sourceMappingURL=index.js.map