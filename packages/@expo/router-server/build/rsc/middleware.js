"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderRscWithImportsAsync = renderRscWithImportsAsync;
exports.renderRscAsync = renderRscAsync;
/**
 * Copyright © 2024 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
// This module is bundled with Metro in web/react-server mode and redirects to platform specific renderers.
const expo_constants_1 = __importDefault(require("expo-constants"));
const node_path_1 = __importDefault(require("node:path"));
const rsc_renderer_1 = require("./rsc-renderer");
const debug_1 = require("../utils/debug");
/** Convert Windows paths to POSIX format for consistent path operations. */
function toPosixPath(filePath) {
    return filePath.replace(/\\/g, '/');
}
const debug = (0, debug_1.createDebug)('expo:router:server:rsc-renderer');
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
/**
 * Convert an absolute file path to a manifest key.
 *
 * Manifest keys can be:
 * - node_modules paths: "react-native-web/dist/exports/View/index.js"
 * - relative paths: "./__e2e__/01-rsc/components/counter.tsx"
 * - package paths: "./../../packages/expo-router/build/rsc/router/client.js"
 *
 * Bundle paths are relative to projectRoot (app directory), while manifest paths
 * are relative to serverRoot (monorepo root). This function handles the mapping.
 */
function resolveManifestKey(filePath, manifest) {
    // Normalize to POSIX for consistent path operations across platforms (Windows uses backslashes)
    const posixFilePath = toPosixPath(filePath);
    // Fast path: already a manifest key
    if (posixFilePath in manifest) {
        return posixFilePath;
    }
    // node_modules files: extract path after last /node_modules/
    if (posixFilePath.includes('/node_modules/')) {
        const idx = posixFilePath.lastIndexOf('/node_modules/');
        const nodeModulesPath = posixFilePath.slice(idx + '/node_modules/'.length);
        if (nodeModulesPath in manifest) {
            return nodeModulesPath;
        }
    }
    // Fallback: search manifest values for matching path suffix
    for (const [key, [actualPath]] of Object.entries(manifest)) {
        if (posixFilePath.endsWith(actualPath) || posixFilePath.endsWith('/' + actualPath)) {
            return key;
        }
    }
    // For app-local files: the bundle path is relative to projectRoot (e.g., "./__e2e__/...")
    // but the manifest key is relative to serverRoot (e.g., "./apps/router-e2e/__e2e__/...")
    // Try to match by checking if the manifest key ends with the input path (minus ./ prefix)
    const pathWithoutDotSlash = posixFilePath.replace(/^\.\//, '');
    for (const key of Object.keys(manifest)) {
        const keyWithoutDotSlash = key.replace(/^\.\//, '');
        if (keyWithoutDotSlash.endsWith('/' + pathWithoutDotSlash) || keyWithoutDotSlash.endsWith(pathWithoutDotSlash)) {
            return key;
        }
    }
    return null;
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
                const actionKey = resolveManifestKey(file, actionManifest);
                if (!actionKey) {
                    throw new Error(`Could not find file in server action manifest: ${file}. ${JSON.stringify(actionManifest)}`);
                }
                const [id, chunk] = actionManifest[actionKey];
                return {
                    id,
                    chunks: chunk ? [chunk] : [],
                };
            }
            const ssrKey = resolveManifestKey(file, ssrManifest);
            if (!ssrKey) {
                throw new Error(`Could not find file in SSR manifest: ${file}`);
            }
            const [id, chunk] = ssrManifest[ssrKey];
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