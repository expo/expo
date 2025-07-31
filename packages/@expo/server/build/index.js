"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestHandler = createRequestHandler;
require("./install");
const isDevelopment = process?.env?.NODE_ENV === 'development';
const debug = 
// TODO: Use WinterCG compatible check
process?.env?.NODE_ENV === 'development'
    ? require('debug')('expo:server')
    : () => { };
const HTML_CACHE_CONTROL = 's-maxage=3600';
const _importCache = new Map();
async function importCached(target) {
    let result = _importCache.get(target);
    if (!result) {
        try {
            result = { type: 'success', value: await import(target) };
        }
        catch (error) {
            result = { type: 'error', value: error };
        }
        _importCache.set(target, result);
    }
    if (result.type === 'success') {
        return result.value;
    }
    else {
        throw result.value;
    }
}
async function importWithIndexFallback(target, filetype = '') {
    const INDEX_PATH = '/index';
    try {
        return await importCached(target + filetype);
    }
    catch (error) {
        if (target.endsWith(INDEX_PATH) && target.length > INDEX_PATH.length) {
            return await importWithIndexFallback(target.slice(0, -INDEX_PATH.length), filetype);
        }
        throw error;
    }
}
async function getRoutesManifest(dist = '.') {
    try {
        // TODO: What path should we support here? should we include pathe or use URL to join the paths?
        const routesMod = await import(`${dist}/_expo/routes.json`);
        // TODO: JSON Schema for validation
        const routesManifest = JSON.parse(routesMod.default);
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
    }
    catch (error) {
        debug('Error loading routes manifest:', error);
        return null;
    }
}
// TODO: Reuse this for dev as well
function createRequestHandler(distFolder, { getRoutesManifest: getInternalRoutesManifest = getRoutesManifest, getHtml = async (_request, route) => {
    const html = (await importWithIndexFallback(`${distFolder}/${route.page}`, '.html')).default;
    return typeof html === 'string' ? html : null;
}, getApiRoute = async (route) => {
    const filePath = `${distFolder}/${route.file}`;
    debug(`Handling API route: ${route.page}: ${filePath}`);
    // TODO: Should catch errors here?
    // TODO: Production worker uses `import` only
    if (/\.c?js$/.test(filePath)) {
        return require(filePath);
    }
    return import(filePath);
}, logApiRouteExecutionError = (error) => {
    console.error(error);
}, handleApiRouteError = async (error) => {
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
}, } = {}) {
    let routesManifest;
    const getRoutesManifestCached = async () => {
        let manifest = null;
        if (getInternalRoutesManifest) {
            // Development
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
                }
                else if (contents instanceof Response) {
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
            let func;
            try {
                func = await getApiRoute(route);
            }
            catch (error) {
                if (error instanceof Error) {
                    logApiRouteExecutionError(error);
                }
                return handleApiRouteError(error);
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
                return (await routeHandler(request, params));
            }
            catch (error) {
                if (error instanceof Error) {
                    logApiRouteExecutionError(error);
                }
                return handleApiRouteError(error);
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
            }
            else if (contents instanceof Response) {
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
                    ...(isDevelopment ? {} : { 'Cache-Control': HTML_CACHE_CONTROL }),
                },
            });
        }
        return requestHandler(request, manifest);
    };
}
function updateRequestWithConfig(request, config) {
    const params = {};
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
function getRedirectRewriteLocation(request, route) {
    const params = updateRequestWithConfig(request, route);
    const urlSearchParams = new URL(request.url).searchParams;
    let location = route.page
        .split('/')
        .map((segment) => {
        let paramName = segment.match(dynamicNameRe)?.[1];
        if (!paramName) {
            return segment;
        }
        else if (paramName.startsWith('...')) {
            paramName = paramName.slice(3);
            const value = params[paramName];
            delete params[paramName];
            return value;
        }
        else {
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
//# sourceMappingURL=index.js.map