"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ctx_1 = require("expo-router/_ctx");
const create_pages_1 = require("./create-pages");
const getRoutesSSR_1 = require("../../getRoutesSSR");
const loadStaticParamsAsync_1 = require("../../loadStaticParamsAsync");
const matchers_1 = require("../../matchers");
const sortRoutes_1 = require("../../sortRoutes");
const UNIMPLEMENTED_PARAMS = new Proxy({}, {
    // Assert that params is unimplemented when accessed.
    get() {
        throw new Error('generateStaticParams(): params is not implemented yet');
    },
});
exports.default = (0, create_pages_1.createPages)(async ({ createPage, createLayout, unstable_setBuildData }) => {
    const routes = (0, getRoutesSSR_1.getRoutes)(_ctx_1.ctx, {
        platform: process.env.EXPO_OS,
        skipGenerated: true,
        importMode: 'lazy',
    });
    if (!routes)
        return;
    async function loadAndConvertStaticParamsAsync(route) {
        const loaded = route.loadRoute();
        let staticPaths = undefined;
        if (route.dynamic) {
            const params = await (0, loadStaticParamsAsync_1.evalStaticParamsAsync)(route, { parentParams: UNIMPLEMENTED_PARAMS }, loaded.generateStaticParams);
            // Sort `params` like `[{a: 'x', b: 'y'}, { a: 'z', b: 'w' }]` for a route.dynamic like `[{name: 'a', deep: false}, {name: 'b', deep: false}]` to `[['a', 'y'], ['z', 'w]]`
            staticPaths = params?.map((p) => {
                const grouped = [];
                for (const dynamic of route.dynamic) {
                    const defined = p[dynamic.name];
                    if (!defined) {
                        throw new Error('generateStaticParams is missing param: ' +
                            dynamic.name +
                            '. In route: ' +
                            route.contextKey);
                    }
                    if (Array.isArray(defined)) {
                        if (defined.length > 1) {
                            throw new Error('generateStaticParams does not support returning multiple static paths for deep dynamic routes in React Server Components yet. Update route: ' +
                                route.contextKey);
                        }
                    }
                    const first = Array.isArray(defined) ? defined[0] : defined;
                    grouped.push(first);
                }
                return grouped;
            });
        }
        else if (loaded.generateStaticParams) {
            throw new Error('Cannot use generateStaticParams without a dynamic route: ' + route.contextKey);
        }
        return staticPaths;
    }
    async function addLayout(route) {
        const normal = (0, matchers_1.getContextKey)(route.contextKey).replace(/\/index$/, '');
        const loaded = route.loadRoute();
        if (loaded.generateStaticParams) {
            throw new Error('generateStaticParams is not supported in _layout routes with React Server Components enabled yet.');
        }
        createLayout({
            // NOTE(EvanBacon): Support routes with top-level "use client"
            component: loaded.default,
            path: normal,
            render: 'static',
            ...loaded.unstable_settings,
        });
        await Promise.all(route.children.sort(sortRoutes_1.sortRoutes).map(async (child) => {
            if (child.type === 'layout') {
                await addLayout(child);
            }
            else {
                const normal = (0, matchers_1.getContextKey)(child.contextKey).replace(/\/index$/, '');
                const loaded = child.loadRoute();
                const settings = loaded.unstable_settings;
                // Support generateStaticParams for dynamic routes by defining the route twice.
                if (loaded.generateStaticParams) {
                    createPage({
                        // NOTE(EvanBacon): Support routes with top-level "use client"
                        component: loaded.default,
                        path: normal,
                        render: 'static',
                        ...loaded.unstable_settings,
                        staticPaths: (await loadAndConvertStaticParamsAsync(child)),
                    });
                    if (settings?.render !== 'static') {
                        createPage({
                            // NOTE(EvanBacon): Support routes with top-level "use client"
                            component: loaded.default,
                            path: normal,
                            render: 'dynamic',
                            ...settings,
                        });
                    }
                }
                else {
                    createPage({
                        // NOTE(EvanBacon): Support routes with top-level "use client"
                        component: loaded.default,
                        path: normal,
                        render: 'dynamic',
                        ...settings,
                    });
                }
            }
        }));
    }
    await addLayout(routes);
});
//# sourceMappingURL=expo-definedRouter.js.map