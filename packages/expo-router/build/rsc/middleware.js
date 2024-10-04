"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderRscAsync = exports.renderRscWithImportsAsync = void 0;
const node_path_1 = __importDefault(require("node:path"));
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
function getSSRManifest(distFolder, platform) {
    const filePath = node_path_1.default.join(distFolder, `_expo/rsc/${platform}/ssr-manifest.json`);
    // @ts-expect-error: Special syntax for expo/metro to access `require`
    return $$require_external(filePath);
}
async function renderRscWithImportsAsync(distFolder, imports, { body, platform, searchParams, config, method, input, contentType }) {
    if (method === 'POST' && !body) {
        throw new Error('Server request must be provided when method is POST (server actions)');
    }
    const context = getRscRenderContext(platform);
    const entries = await imports.router();
    const ssrManifest = getSSRManifest(distFolder, platform);
    return (0, rsc_renderer_1.renderRsc)({
        body: body ?? undefined,
        context,
        config,
        input,
        contentType,
        decodedBody: searchParams.get('x-expo-params'),
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
        loadServerModuleRsc: async (url) => {
            // TODO: SSR load action code from on disk file.
            throw new Error('React server actions are not implemented yet');
        },
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
//# sourceMappingURL=middleware.js.map