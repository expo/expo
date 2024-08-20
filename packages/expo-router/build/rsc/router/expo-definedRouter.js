"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ctx_1 = require("expo-router/_ctx");
const create_pages_1 = require("./create-pages");
const getRoutesSSR_1 = require("../../getRoutesSSR");
const sortRoutes_1 = require("../../sortRoutes");
const matchers_1 = require("../../matchers");
exports.default = (0, create_pages_1.createPages)(async ({ createPage, createLayout, unstable_setBuildData }) => {
    const files = _ctx_1.ctx.keys();
    const routes = (0, getRoutesSSR_1.getRoutes)(_ctx_1.ctx, {
        platform: process.env.EXPO_OS,
        skipGenerated: true,
        importMode: 'lazy',
    });
    if (!routes)
        return;
    function addLayout(route, parent) {
        const normal = (0, matchers_1.getContextKey)(route.contextKey).replace(/\/index$/, '');
        console.log('layout:', normal);
        createLayout({
            path: normal,
            // staticPaths
            // NOTE(EvanBacon): Support routes with top-level "use client"
            component: route.loadRoute().default,
            render: 'static',
            ...route.loadRoute().unstable_settings,
            // ...config,
        });
        route.children.sort(sortRoutes_1.sortRoutes).forEach((child) => {
            if (child.type === 'layout') {
                addLayout(child, normal);
            }
            else {
                const normal = (0, matchers_1.getContextKey)(child.contextKey).replace(/\/index$/, '');
                console.log('page:', normal, parent, child);
                createPage({
                    path: normal,
                    // NOTE(EvanBacon): Support routes with top-level "use client"
                    component: child.loadRoute().default,
                    render: 'dynamic',
                    ...child.loadRoute().unstable_settings,
                });
            }
        });
    }
    addLayout(routes);
    // console.log(routes);
    // for (const file of files) {
    //   const mod = await ctx(file);
    //   // NOTE(EvanBacon): Support `getConfig` in routes with top-level "use client"
    //   const config = 'getConfig' in mod ? await mod.getConfig?.() : {};
    //   const pathItems = file
    //     .replace(/^\.\//, '')
    //     .replace(/\.\w+$/, '')
    //     .split('/')
    //     .filter(Boolean);
    //   const path =
    //     '/' +
    //     (['_layout', 'index'].includes(pathItems.at(-1)!) ? pathItems.slice(0, -1) : pathItems).join(
    //       '/'
    //     );
    //   unstable_setBuildData(path, files);
    //   if (pathItems.at(-1) === '_layout') {
    //     console.log('layout:', path, file);
    //     // TODO: Support static paths
    //     // const staticPaths = await mod.generateStaticParams()
    //     createLayout({
    //       path,
    //       // staticPaths
    //       // NOTE(EvanBacon): Support routes with top-level "use client"
    //       component: 'default' in mod ? mod.default : mod,
    //       render: 'static',
    //       ...config,
    //     });
    //   } else {
    //     console.log('page:', path, file);
    //     createPage({
    //       path,
    //       // NOTE(EvanBacon): Support routes with top-level "use client"
    //       component: 'default' in mod ? mod.default : mod,
    //       render: 'dynamic',
    //       ...config,
    //     });
    //   }
    // }
});
//# sourceMappingURL=expo-definedRouter.js.map