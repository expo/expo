"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ctx_1 = require("expo-router/_ctx");
const routing_1 = require("expo-router/internal/routing");
const createPages_1 = require("./createPages");
const getRoutesSSR_1 = require("../../getRoutesSSR");
const loadStaticParamsAsync_1 = require("../../loadStaticParamsAsync");
function readSettings(loaded) {
    const raw = (loaded.unstable_settings ?? {});
    const render = raw.render === 'static' || raw.render === 'dynamic' ? raw.render : undefined;
    const unstable_disableSSR = typeof raw.unstable_disableSSR === 'boolean' ? raw.unstable_disableSSR : undefined;
    return { render, unstable_disableSSR };
}
const UNIMPLEMENTED_PARAMS = new Proxy({}, {
    get() {
        throw new Error('generateStaticParams(): params is not implemented yet');
    },
});
async function loadStaticParamsForRoute(route) {
    const loaded = route.loadRoute();
    if (!route.dynamic) {
        if (loaded.generateStaticParams) {
            throw new Error('Cannot use generateStaticParams without a dynamic route: ' + route.contextKey);
        }
        return undefined;
    }
    const params = await (0, loadStaticParamsAsync_1.evalStaticParamsAsync)(route, { parentParams: UNIMPLEMENTED_PARAMS }, loaded.generateStaticParams);
    return params?.map((p) => {
        const grouped = [];
        for (const dynamic of route.dynamic) {
            const defined = p[dynamic.name];
            if (!defined) {
                throw new Error('generateStaticParams is missing param: ' +
                    dynamic.name +
                    '. In route: ' +
                    route.contextKey);
            }
            if (Array.isArray(defined) && defined.length > 1) {
                throw new Error('generateStaticParams does not support returning multiple static paths for deep dynamic routes in React Server Components yet. Update route: ' +
                    route.contextKey);
            }
            const first = Array.isArray(defined) ? defined[0] : defined;
            if (first != null) {
                grouped.push(first);
            }
        }
        return grouped;
    });
}
async function registerRouteTree(api, route) {
    const layoutPath = (0, routing_1.getContextKey)(route.contextKey).replace(/\/index$/, '');
    const loaded = route.loadRoute();
    if (loaded.generateStaticParams) {
        throw new Error('generateStaticParams is not supported in _layout routes with React Server Components enabled yet.');
    }
    const layoutSettings = readSettings(loaded);
    api.createLayout({
        component: loaded.default,
        path: layoutPath,
        render: layoutSettings.render ?? 'static',
    });
    await Promise.all(route.children.sort(routing_1.sortRoutes).map(async (child) => {
        if (child.type === 'layout') {
            await registerRouteTree(api, child);
            return;
        }
        const childPath = (0, routing_1.getContextKey)(child.contextKey).replace(/\/index$/, '');
        const childLoaded = child.loadRoute();
        const settings = readSettings(childLoaded);
        if (childLoaded.generateStaticParams) {
            api.createPage({
                component: childLoaded.default,
                path: childPath,
                render: 'static',
                staticPaths: (await loadStaticParamsForRoute(child)),
                unstable_disableSSR: settings.unstable_disableSSR,
            });
            if (settings.render !== 'static') {
                api.createPage({
                    component: childLoaded.default,
                    path: childPath,
                    render: 'dynamic',
                    unstable_disableSSR: settings.unstable_disableSSR,
                });
            }
            return;
        }
        api.createPage({
            component: childLoaded.default,
            path: childPath,
            render: settings.render ?? 'dynamic',
            unstable_disableSSR: settings.unstable_disableSSR,
        });
    }));
}
exports.default = (getRouteOptions) => ({
    default: (0, createPages_1.createPages)(async ({ createPage, createLayout, unstable_setBuildData }) => {
        const routes = (0, getRoutesSSR_1.getRoutes)(_ctx_1.ctx, {
            ...getRouteOptions,
            platform: process.env.EXPO_OS,
            skipGenerated: true,
            importMode: 'lazy',
        });
        if (!routes)
            return;
        await registerRouteTree({ createPage, createLayout, unstable_setBuildData }, routes);
    }),
});
//# sourceMappingURL=expo-definedRouter.js.map