"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ctx_1 = require("expo-router/_ctx");
const create_pages_1 = require("./create-pages");
exports.default = (0, create_pages_1.createPages)(async ({ createPage, createLayout, unstable_setBuildData }) => {
    const files = _ctx_1.ctx.keys();
    for (const file of files) {
        const mod = await (0, _ctx_1.ctx)(file);
        // NOTE(EvanBacon): Support `getConfig` in routes with top-level "use client"
        const config = 'getConfig' in mod ? await mod.getConfig?.() : {};
        const pathItems = file
            .replace(/^\.\//, '')
            .replace(/\.\w+$/, '')
            .split('/')
            .filter(Boolean);
        const path = '/' +
            (['_layout', 'index'].includes(pathItems.at(-1)) ? pathItems.slice(0, -1) : pathItems).join('/');
        unstable_setBuildData(path, files);
        if (pathItems.at(-1) === '_layout') {
            createLayout({
                path,
                // NOTE(EvanBacon): Support routes with top-level "use client"
                component: 'default' in mod ? mod.default : mod,
                render: 'static',
                ...config,
            });
        }
        else {
            createPage({
                path,
                // NOTE(EvanBacon): Support routes with top-level "use client"
                component: 'default' in mod ? mod.default : mod,
                render: 'dynamic',
                ...config,
            });
        }
    }
});
//# sourceMappingURL=expo-definedRouter.js.map