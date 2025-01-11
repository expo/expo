"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderRscAsync = exports.renderRscWithImportsAsync = void 0;
const _async_server_import_1 = require("expo-router/_async-server-import");
const node_path_1 = __importDefault(require("node:path"));
const rsc_renderer_1 = require("./rsc-renderer");
const debug = require('debug')('expo:server:rsc-renderer');
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
function interopDefault(mod) {
    if ('default' in mod && typeof mod.default === 'object' && mod.default) {
        const def = mod.default;
        if ('default' in def && typeof def.default === 'object' && def.default) {
            return def.default;
        }
        return mod.default;
    }
    return mod;
}
async function getServerActionManifest(distFolder, platform) {
    const filePath = `../../rsc/${platform}/action-manifest.js`;
    return interopDefault(await (0, _async_server_import_1.asyncServerImport)(filePath));
}
async function getSSRManifest(distFolder, platform) {
    const filePath = `../../rsc/${platform}/ssr-manifest.js`;
    return interopDefault(await (0, _async_server_import_1.asyncServerImport)(filePath));
}
async function renderRscWithImportsAsync(distFolder, imports, { body, platform, searchParams, config, method, input, contentType, headers }) {
    globalThis.__expo_platform_header = platform;
    if (method === 'POST' && !body) {
        throw new Error('Server request must be provided when method is POST (server actions)');
    }
    const context = getRscRenderContext(platform);
    context['__expo_requestHeaders'] = headers;
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
                    throw new Error(`Could not find file in server action manifest: ${file}. ${JSON.stringify(actionManifest)}`);
                }
                const [id, chunk] = actionManifest[file];
                return {
                    id,
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
            const filePath = node_path_1.default.join('../../../', file);
            const m = await (0, _async_server_import_1.asyncServerImport)(filePath);
            // TODO: This is a hack to workaround a cloudflare/metro issue where there's an extra `default` wrapper.
            if (typeof caches !== 'undefined') {
                return m.default;
            }
            return m;
        },
        entries: entries,
    });
}
exports.renderRscWithImportsAsync = renderRscWithImportsAsync;
async function renderRscAsync(distFolder, args) {
    const platform = args.platform;
    return renderRscWithImportsAsync(distFolder, {
        router: () => {
            // Assumes this file is saved to: `dist/server/_expo/functions/_flight/[...rsc].js`
            const filePath = `../../rsc/${platform}/router.js`;
            return (0, _async_server_import_1.asyncServerImport)(filePath);
        },
    }, args);
}
exports.renderRscAsync = renderRscAsync;
//# sourceMappingURL=middleware.js.map