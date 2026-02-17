"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEnvironment = createEnvironment;
const ImmutableRequest_1 = require("../../ImmutableRequest");
const matchers_1 = require("../../utils/matchers");
function initManifestRegExp(manifest) {
    return {
        ...manifest,
        htmlRoutes: manifest.htmlRoutes?.map((route) => ({
            ...route,
            namedRegex: new RegExp(route.namedRegex),
        })) ?? [],
        apiRoutes: manifest.apiRoutes?.map((route) => ({
            ...route,
            namedRegex: new RegExp(route.namedRegex),
        })) ?? [],
        notFoundRoutes: manifest.notFoundRoutes?.map((route) => ({
            ...route,
            namedRegex: new RegExp(route.namedRegex),
        })) ?? [],
        redirects: manifest.redirects?.map((route) => ({
            ...route,
            namedRegex: new RegExp(route.namedRegex),
        })) ?? [],
        rewrites: manifest.rewrites?.map((route) => ({
            ...route,
            namedRegex: new RegExp(route.namedRegex),
        })) ?? [],
    };
}
function createEnvironment(input) {
    // Cached manifest and SSR renderer, initialized on first request
    let cachedManifest;
    let ssrRenderer = null;
    async function getRoutesManifest() {
        if (cachedManifest === undefined || input.isDevelopment) {
            const json = await input.readJson('_expo/routes.json');
            cachedManifest = json ? initManifestRegExp(json) : null;
        }
        return cachedManifest;
    }
    async function getServerRenderer() {
        if (ssrRenderer && !input.isDevelopment) {
            return ssrRenderer;
        }
        const manifest = await getRoutesManifest();
        if (manifest?.rendering?.mode !== 'ssr') {
            return null;
        }
        // If `manifest.rendering.mode === 'ssr'`, we always expect the SSR rendering module to be
        // available
        const ssrModule = (await input.loadModule(manifest.rendering.file));
        if (!ssrModule) {
            throw new Error(`SSR module not found at: ${manifest.rendering.file}`);
        }
        const assets = manifest.assets;
        ssrRenderer = async (request, options) => {
            const url = new URL(request.url);
            const location = new URL(url.pathname + url.search, url.origin);
            return ssrModule.getStaticContent(location, {
                loader: options?.loader,
                request,
                assets,
            });
        };
        return ssrRenderer;
    }
    async function executeLoader(request, route, params) {
        if (!route.loader) {
            return undefined;
        }
        const loaderModule = (await input.loadModule(route.loader));
        if (!loaderModule) {
            throw new Error(`Loader module not found at: ${route.loader}`);
        }
        return loaderModule.loader(new ImmutableRequest_1.ImmutableRequest(request), params);
    }
    return {
        getRoutesManifest,
        async getHtml(request, route) {
            // SSR path: Render at runtime if SSR module is available
            const renderer = await getServerRenderer();
            if (renderer) {
                let renderOptions;
                try {
                    if (route.loader) {
                        const params = (0, matchers_1.parseParams)(request, route);
                        const result = await executeLoader(request, route, params);
                        const data = (0, matchers_1.isResponse)(result) ? await result.json() : result;
                        renderOptions = {
                            loader: {
                                data: data ?? null,
                                key: (0, matchers_1.resolveLoaderContextKey)(route.page, params),
                            },
                        };
                    }
                    return await renderer(request, renderOptions);
                }
                catch (error) {
                    console.error('SSR render error:', error);
                    throw error;
                }
            }
            // SSG fallback: Read pre-rendered HTML from disk
            let html;
            if ((html = await input.readText(route.page + '.html')) != null) {
                return html;
            }
            // Serve a static file by route name with hoisted index
            // See: https://github.com/expo/expo/pull/27935
            const INDEX_PATH = '/index';
            if (route.page.endsWith(INDEX_PATH) && route.page.length > INDEX_PATH.length) {
                const page = route.page.slice(0, -INDEX_PATH.length);
                if ((html = await input.readText(page + '.html')) != null) {
                    return html;
                }
            }
            return null;
        },
        async getApiRoute(route) {
            return input.loadModule(route.file);
        },
        async getMiddleware(middleware) {
            const mod = (await input.loadModule(middleware.file));
            if (typeof mod?.default !== 'function') {
                return null;
            }
            return mod;
        },
        async getLoaderData(request, route) {
            const params = (0, matchers_1.parseParams)(request, route);
            const result = await executeLoader(request, route, params);
            if ((0, matchers_1.isResponse)(result)) {
                return result;
            }
            return Response.json(result ?? null);
        },
        async preload() {
            if (input.isDevelopment) {
                return;
            }
            const manifest = await getRoutesManifest();
            if (manifest) {
                const requests = [];
                if (manifest.middleware)
                    requests.push(manifest.middleware.file);
                if (manifest.rendering)
                    requests.push(manifest.rendering.file);
                for (const apiRoute of manifest.apiRoutes)
                    requests.push(apiRoute.file);
                for (const htmlRoute of manifest.htmlRoutes) {
                    if (htmlRoute.loader)
                        requests.push(htmlRoute.loader);
                }
                await Promise.all(requests.map((request) => input.loadModule(request)));
            }
        },
    };
}
//# sourceMappingURL=common.js.map