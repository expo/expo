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
    return {
        async getRoutesManifest() {
            const json = await input.readJson('_expo/routes.json');
            return initManifestRegExp(json);
        },
        async getHtml(_request, route) {
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
        handleRouteError(error) {
            throw error;
        },
    };
}
//# sourceMappingURL=common.js.map