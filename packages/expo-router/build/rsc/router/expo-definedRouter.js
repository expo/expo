"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ctx_1 = require("expo-router/_ctx");
const create_pages_1 = require("./create-pages");
const getRoutesSSR_1 = require("../../getRoutesSSR");
const matchers_1 = require("../../matchers");
const sortRoutes_1 = require("../../sortRoutes");
exports.default = (0, create_pages_1.createPages)(async ({ createPage, createLayout, unstable_setBuildData }) => {
    const routes = (0, getRoutesSSR_1.getRoutes)(_ctx_1.ctx, {
        platform: process.env.EXPO_OS,
        skipGenerated: true,
        importMode: 'lazy',
    });
    if (!routes)
        return;
    function addLayout(route) {
        const normal = (0, matchers_1.getContextKey)(route.contextKey).replace(/\/index$/, '');
        createLayout({
            // NOTE(EvanBacon): Support routes with top-level "use client"
            component: route.loadRoute().default,
            path: normal,
            // staticPaths
            render: 'static',
            ...route.loadRoute().unstable_settings,
        });
        route.children.sort(sortRoutes_1.sortRoutes).forEach((child) => {
            if (child.type === 'layout') {
                addLayout(child);
            }
            else {
                const normal = (0, matchers_1.getContextKey)(child.contextKey).replace(/\/index$/, '');
                createPage({
                    // NOTE(EvanBacon): Support routes with top-level "use client"
                    component: child.loadRoute().default,
                    path: normal,
                    render: 'dynamic',
                    ...child.loadRoute().unstable_settings,
                });
            }
        });
    }
    addLayout(routes);
});
//# sourceMappingURL=expo-definedRouter.js.map