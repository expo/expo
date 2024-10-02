"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderRscAsync = exports.renderRscWithImportsAsync = void 0;
const node_path_1 = __importDefault(require("node:path"));
const debug = require('debug')('expo:server:rsc-renderer');
const rsc_renderer_1 = require("./rsc-renderer");
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
async function getServerActionManifest(distFolder, platform) {
    const filePath = node_path_1.default.join(distFolder, `_expo/rsc/${platform}/action-manifest.json`);
    // @ts-expect-error
    return $$require_external(filePath);
    // return await import(/* @metro-ignore */ filePath);
}
async function getSSRManifest(distFolder, platform) {
    const filePath = node_path_1.default.join(distFolder, `_expo/rsc/${platform}/ssr-manifest.json`);
    // @ts-expect-error
    return $$require_external(filePath);
    // return import(/* @metro-ignore */ filePath);
}
async function renderRscWithImportsAsync(distFolder, imports, { body, platform, searchParams, config, method, input, contentType }) {
    if (method === 'POST' && !body) {
        throw new Error('Server request must be provided when method is POST (server actions)');
    }
    const context = getRscRenderContext(platform);
    const entries = await imports.router();
    const ssrManifest = await getSSRManifest(distFolder, platform);
    const actionManifest = await getServerActionManifest(distFolder, platform);
    return (0, rsc_renderer_1.renderRsc)({
        body: body ?? undefined,
        context,
        config,
        input,
        contentType,
        decodedBody: searchParams.get('x-expo-params'),
    }, {
        isExporting: true,
        resolveClientEntry(file, isServer) {
            debug('resolveClientEntry', file, { isServer });
            if (isServer) {
                if (!(file in actionManifest)) {
                    throw new Error(`Could not find file in server action manifest: ${file}`);
                }
                const [id, chunk] = actionManifest[file];
                return {
                    // TODO
                    id: id,
                    chunks: chunk ? [chunk] : [],
                };
            }
            if (!(file in ssrManifest)) {
                throw new Error(`Could not find file in SSR manifest: ${file}`);
            }
            const [id, chunk] = ssrManifest[file];
            return {
                id,
                chunks: chunk ? [chunk] : [],
            };
        },
        async loadServerModuleRsc(file) {
            debug('loadServerModuleRsc', file);
            const filePath = node_path_1.default.join(distFolder, file);
            // @ts-expect-error
            return $$require_external(filePath);
            // return import(/* @metro-ignore */ filePath);
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
            // return import(/* @metro-ignore */ filePath);
        },
    }, args);
}
exports.renderRscAsync = renderRscAsync;
//# sourceMappingURL=middleware.js.map