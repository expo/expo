"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderRscAsync = exports.renderRscWithImportsAsync = void 0;
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
// const IMPORT_MAP = {
//   renderer: () => require(`virtual:web:renderer.js`),
//   router: () => require(`virtual:web:router.js`),
// };
// function getRscRendererAsync(
//   distFolder: string,
//   platform: string
// ): typeof import('expo-router/src/rsc/rsc-renderer') {
//   return IMPORT_MAP['renderer']();
//   // TODO: Read from a predetermined location in the dist folder.
//   // const filePath = path.join(distFolder, `_expo/rsc/${platform}/rsc-renderer.js`);
//   // return eval('require')(filePath);
//   // if (/\.[cj]s$/.test(filePath)) {
//   //   }
//   //   return import(filePath);
// }
function getSSRManifest(distFolder, platform) {
    return {};
    // const filePath = path.join(distFolder, `_expo/rsc/${platform}/ssr-manifest.json`);
    // return eval('require')(filePath);
    // TODO: ...
}
// function getEntries(
//   distFolder: string,
//   platform: string
// ): typeof import('expo-router/src/rsc/router/expo-definedRouter') {
//   return IMPORT_MAP['router']();
//   // expo-definedRouter.ts
//   // const filePath = path.join(distFolder, `_expo/rsc/${platform}/router.js`);
//   // return eval('require')(filePath);
//   // TODO: ...
// }
async function renderRscWithImportsAsync(distFolder, imports, { body, platform, searchParams, config, method, input, contentType }) {
    if (method === 'POST') {
        if (!body)
            throw new Error('Server request must be provided when method is POST (server actions)');
    }
    const { renderRsc } = await imports.renderer();
    const context = getRscRenderContext(platform);
    const entries = await imports.router();
    if (method === 'POST') {
        // HACK: This is some mock function to load the JS in to memory which in turn ensures the server actions are registered.
        entries.default.getBuildConfig(async (input) => []);
    }
    const ssrManifest = getSSRManifest(distFolder, platform);
    return renderRsc({
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
            // Convert file path to a split chunk path.
            console.log('Resolve client entry:', file, ssrManifest[file]);
            return {
                id: 'TODO',
                url: [ssrManifest[file]].filter(Boolean),
            };
        },
        entries: entries,
    });
}
exports.renderRscWithImportsAsync = renderRscWithImportsAsync;
async function renderRscAsync(distFolder, args) {
    const platform = args.platform;
    return renderRscWithImportsAsync(distFolder, {
        renderer: () => {
            // TODO: Read from a predetermined location in the dist folder.
            const filePath = node_path_1.default.join(distFolder, `_expo/rsc/${platform}/rsc-renderer.js`);
            return require(filePath);
            // if (/\.[cj]s$/.test(filePath)) {
            //   }
            //   return import(filePath);
        },
        router: () => {
            const filePath = node_path_1.default.join(distFolder, `_expo/rsc/${platform}/router.js`);
            return require(filePath);
        },
    }, args);
}
exports.renderRscAsync = renderRscAsync;
//# sourceMappingURL=rsc-standalone.js.map