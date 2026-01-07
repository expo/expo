"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEnvironment = createEnvironment;
function initManifestRegExp(manifest) {
    return {
        ...manifest,
        htmlRoutes: manifest.htmlRoutes.map((route) => ({
            ...route,
            namedRegex: new RegExp(route.namedRegex),
        })),
        apiRoutes: manifest.apiRoutes.map((route) => ({
            ...route,
            namedRegex: new RegExp(route.namedRegex),
        })),
        notFoundRoutes: manifest.notFoundRoutes.map((route) => ({
            ...route,
            namedRegex: new RegExp(route.namedRegex),
        })),
        redirects: manifest.redirects?.map((route) => ({
            ...route,
            namedRegex: new RegExp(route.namedRegex),
        })),
        rewrites: manifest.rewrites?.map((route) => ({
            ...route,
            namedRegex: new RegExp(route.namedRegex),
        })),
    };
}
function createEnvironment(input) {
    // Cached manifest and SSR renderer, initialized on first request
    let cachedManifest = null;
    let ssrRenderer = null;
    async function getCachedRoutesManifest() {
        if (!cachedManifest) {
            const json = await input.readJson('_expo/routes.json');
            cachedManifest = initManifestRegExp(json);
        }
        return cachedManifest;
    }
    async function getServerRenderer() {
        if (ssrRenderer) {
            return ssrRenderer;
        }
        const manifest = await getCachedRoutesManifest();
        if (manifest.rendering?.mode !== 'ssr') {
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
    return {
        async getRoutesManifest() {
            return getCachedRoutesManifest();
        },
        async getHtml(request, route) {
            // SSR path: Render at runtime if SSR module is available
            const renderer = await getServerRenderer();
            if (renderer) {
                try {
                    return await renderer(request);
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
    };
}
//# sourceMappingURL=common.js.map