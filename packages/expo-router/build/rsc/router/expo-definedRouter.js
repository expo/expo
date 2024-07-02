"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../runtime");
const _ctx_1 = require("expo-router/_ctx");
const create_pages_1 = require("./create-pages");
function fsRouter(loader, pages = 'pages') {
    return (0, create_pages_1.createPages)(async ({ createPage, createLayout, unstable_setBuildData }, { unstable_buildConfig }) => {
        let files;
        if (unstable_buildConfig) {
            // TODO FIXME this is toooooooo naive
            files = unstable_buildConfig[0].customData.data;
        }
        else {
            files = _ctx_1.ctx.keys();
            files = files.flatMap((file) => {
                return [file];
            });
        }
        for (const file of files) {
            const mod = await loader(pages, file);
            // NOTE(EvanBacon): Support `getConfig` in routes with top-level "use client"
            const config = 'getConfig' in mod ? await mod.getConfig?.() : {};
            const pathItems = file
                .replace(/^\.\//, '')
                .replace(/\.\w+$/, '')
                .split('/')
                .filter(Boolean);
            const path = '/' +
                (['_layout', 'index'].includes(pathItems.at(-1))
                    ? pathItems.slice(0, -1)
                    : pathItems).join('/');
            unstable_setBuildData(path, files); // FIXME toooooo naive, not efficient
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
}
exports.default = fsRouter(loader);
function loader(dir, file) {
    return (0, _ctx_1.ctx)(file);
}
//# sourceMappingURL=expo-definedRouter.js.map