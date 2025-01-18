"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRequestHandler = exports.getRoutesManifest = void 0;
require("@expo/server/install");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const debug = process.env.NODE_ENV === 'development'
    ? require('debug')('expo:server')
    : () => { };
function getProcessedManifest(path) {
    // TODO: JSON Schema for validation
    const routesManifest = JSON.parse(node_fs_1.default.readFileSync(path, 'utf-8'));
    const parsed = {
        ...routesManifest,
        notFoundRoutes: routesManifest.notFoundRoutes.map((value) => {
            return {
                ...value,
                namedRegex: new RegExp(value.namedRegex),
            };
        }),
        apiRoutes: routesManifest.apiRoutes.map((value) => {
            return {
                ...value,
                namedRegex: new RegExp(value.namedRegex),
            };
        }),
        htmlRoutes: routesManifest.htmlRoutes.map((value) => {
            return {
                ...value,
                namedRegex: new RegExp(value.namedRegex),
            };
        }),
    };
    return parsed;
}
function getRoutesManifest(distFolder) {
    return getProcessedManifest(node_path_1.default.join(distFolder, '_expo/routes.json'));
}
exports.getRoutesManifest = getRoutesManifest;
// TODO: Reuse this for dev as well
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
}, logApiRouteExecutionError = (error) => {
    console.error(error);
}, handleApiRouteError = async (error) => {
    if ('statusCode' in error && typeof error.statusCode === 'number') {
        return new Response(error.message, {
            status: error.statusCode,
            headers: {
                'Content-Type': 'text/plain',
            },
        });
    }
    return new Response('Internal server error', {
        status: 500,
        headers: {
            'Content-Type': 'text/plain',
        },
    });
}, } = {}) {
    let routesManifest;
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
    return async function handler(request) {
        if (getInternalRoutesManifest) {
            const manifest = await getInternalRoutesManifest(distFolder);
            if (manifest) {
                routesManifest = manifest;
            }
            else {
                // Development error when Expo Router is not setup.
                return new Response('No routes manifest found', {
                    status: 404,
                    headers: {
                        'Content-Type': 'text/plain',
                    },
                });
            }
        }
        else if (!routesManifest) {
            routesManifest = getRoutesManifest(distFolder);
        }
        const url = new URL(request.url, 'http://expo.dev');
        const sanitizedPathname = url.pathname;
        debug('Request', sanitizedPathname);
        if (request.method === 'GET' || request.method === 'HEAD') {
            // First test static routes
            for (const route of routesManifest.htmlRoutes) {
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
                        headers: {
                            'Content-Type': 'text/plain',
                        },
                    });
                }
                else if (contents instanceof Response) {
                    return contents;
                }
                return new Response(contents, {
                    status: 200,
                    headers: {
                        'Content-Type': 'text/html',
                    },
                });
            }
        }
        // Next, test API routes
        for (const route of routesManifest.apiRoutes) {
            if (!route.namedRegex.test(sanitizedPathname)) {
                continue;
            }
            const func = await getApiRoute(route);
            if (func instanceof Response) {
                return func;
            }
            const routeHandler = func?.[request.method];
            if (!routeHandler) {
                return new Response('Method not allowed', {
                    status: 405,
                    headers: {
                        'Content-Type': 'text/plain',
                    },
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
        for (const route of routesManifest.notFoundRoutes) {
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
                    headers: {
                        'Content-Type': 'text/plain',
                    },
                });
            }
            else if (contents instanceof Response) {
                return contents;
            }
            return new Response(contents, {
                status: 404,
                headers: {
                    'Content-Type': 'text/html',
                },
            });
        }
        // 404
        const response = new Response('Not found', {
            status: 404,
            headers: {
                'Content-Type': 'text/plain',
            },
        });
        return response;
    };
}
exports.createRequestHandler = createRequestHandler;
//# sourceMappingURL=index.js.map