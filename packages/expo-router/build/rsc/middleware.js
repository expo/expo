"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderRscWithImportsAsync = renderRscWithImportsAsync;
exports.renderRscAsync = renderRscAsync;
const expo_constants_1 = __importDefault(require("expo-constants"));
const node_path_1 = __importDefault(require("node:path"));
const rsc_renderer_1 = require("./rsc-renderer");
const debug = require('debug')('expo:server:rsc-renderer');
// Tracking the implementation in expo/cli's MetroBundlerDevServer
const rscRenderContext = new Map();
function serverRequire(...targetOutputModulePath) {
    // NOTE(@kitten): This `__dirname` will be located in the output file system, e.g. `dist/server/*`
    const filePath = node_path_1.default.join(__dirname, ...targetOutputModulePath);
    return $$require_external(filePath);
}
function getRscRenderContext(platform) {
    // NOTE(EvanBacon): We memoize this now that there's a persistent server storage cache for Server Actions.
    if (rscRenderContext.has(platform)) {
        return rscRenderContext.get(platform);
    }
    const context = {};
    rscRenderContext.set(platform, context);
    return context;
}
function getServerActionManifest(_distFolder, platform) {
    const filePath = `../../rsc/${platform}/action-manifest.js`;
    return serverRequire(filePath);
}
function getSSRManifest(_distFolder, platform) {
    const filePath = `../../rsc/${platform}/ssr-manifest.js`;
    return serverRequire(filePath);
}
async function renderRscWithImportsAsync(distFolder, imports, { body, platform, searchParams, config, method, input, contentType, headers }) {
    globalThis.__expo_platform_header = platform;
    if (method === 'POST' && !body) {
        throw new Error('Server request must be provided when method is POST (server actions)');
    }
    const context = getRscRenderContext(platform);
    context['__expo_requestHeaders'] = headers;
    const router = await imports.router();
    const entries = router.default({
        redirects: expo_constants_1.default.expoConfig?.extra?.router?.redirects,
        rewrites: expo_constants_1.default.expoConfig?.extra?.router?.rewrites,
    });
    const ssrManifest = getSSRManifest(distFolder, platform);
    const actionManifest = getServerActionManifest(distFolder, platform);
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
            // NOTE(@kitten): [WORKAROUND] Assumes __dirname is at `dist/server/_expo/functions/_flight`
            return serverRequire('../../../', file);
        },
        entries: entries,
    });
}
async function renderRscAsync(distFolder, args) {
    const platform = args.platform;
    return renderRscWithImportsAsync(distFolder, {
        router: () => {
            // NOTE(@kitten): [WORKAROUND] Assumes __dirname is at `dist/server/_expo/functions/_flight`
            return serverRequire(`../../rsc/${platform}/router.js`);
        },
    }, args);
}
//# sourceMappingURL=middleware.js.map