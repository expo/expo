"use strict";
/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderRscAsync = exports.renderRscWithImportsAsync = void 0;
// This module is bundled with Metro in web/react-server mode and redirects to platform specific renderers.
const rsc_renderer_1 = require("expo-router/build/rsc/rsc-renderer");
const node_path_1 = __importDefault(require("node:path"));
// Tracking the implementation in expo/cli's MetroBundlerDevServer
const rscRenderContext = new Map();
function getRscRenderContext(platform) {
    // NOTE(EvanBacon): We memoize this now that there's a persistent server storage cache for Server Actions.
    if (rscRenderContext.has(platform)) {
        return rscRenderContext.get(platform);
    }
    const context = {};
    rscRenderContext.set(platform, context);
    return context;
}
function getSSRManifest(distFolder, platform) {
    const filePath = node_path_1.default.join(distFolder, `_expo/rsc/${platform}/ssr-manifest.json`);
    // @ts-expect-error: Special syntax for expo/metro to access `require`
    return $$require_external(filePath);
}
async function renderRscWithImportsAsync(distFolder, imports, { body, platform, searchParams, config, method, input, contentType }) {
    if (method === 'POST') {
        if (!body)
            throw new Error('Server request must be provided when method is POST (server actions)');
    }
    const context = getRscRenderContext(platform);
    const entries = await imports.router();
    if (method === 'POST') {
        // HACK: This is some mock function to load the JS in to memory which in turn ensures the server actions are registered.
        entries.default.getBuildConfig(async (input) => []);
    }
    const ssrManifest = getSSRManifest(distFolder, platform);
    return (0, rsc_renderer_1.renderRsc)({
        body: body ?? undefined,
        searchParams,
        context,
        config,
        method,
        input,
        contentType,
    }, {
        isExporting: true,
        resolveClientEntry(file) {
            const [id, chunk] = ssrManifest[file];
            return {
                id,
                chunks: chunk ? [chunk] : [],
            };
        },
        entries: entries,
    });
}
exports.renderRscWithImportsAsync = renderRscWithImportsAsync;
async function renderRscAsync(distFolder, args) {
    const platform = args.platform;
    return renderRscWithImportsAsync(distFolder, {
        router: () => {
            const filePath = node_path_1.default.join(distFolder, `_expo/rsc/${platform}/router.js`);
            // @ts-expect-error: Special syntax for expo/metro to access `require`
            return $$require_external(filePath);
        },
    }, args);
}
exports.renderRscAsync = renderRscAsync;
//# sourceMappingURL=rsc-standalone.js.map