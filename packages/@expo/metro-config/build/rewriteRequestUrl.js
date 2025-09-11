"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRouterDirectory = getRouterDirectory;
exports.getRewriteRequestUrl = getRewriteRequestUrl;
// Copyright 2023-present 650 Industries (Expo). All rights reserved.
const config_1 = require("@expo/config");
const paths_1 = require("@expo/config/paths");
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const debug = require('debug')('expo:metro:config:rewriteRequestUrl');
function directoryExistsSync(file) {
    try {
        return fs_1.default.statSync(file)?.isDirectory() ?? false;
    }
    catch {
        return false;
    }
}
function isEnableHermesManaged(expoConfig, platform) {
    switch (platform) {
        case 'android': {
            return (expoConfig.android?.jsEngine ?? expoConfig.jsEngine) !== 'jsc';
        }
        case 'ios': {
            return (expoConfig.ios?.jsEngine ?? expoConfig.jsEngine) !== 'jsc';
        }
        default:
            return false;
    }
}
function getAsyncRoutesFromExpoConfig(exp, mode, platform) {
    let asyncRoutesSetting;
    if (exp.extra?.router?.asyncRoutes) {
        const asyncRoutes = exp.extra?.router?.asyncRoutes;
        if (['boolean', 'string'].includes(typeof asyncRoutes)) {
            asyncRoutesSetting = asyncRoutes;
        }
        else if (typeof asyncRoutes === 'object') {
            asyncRoutesSetting = asyncRoutes[platform] ?? asyncRoutes.default;
        }
    }
    return [mode, true].includes(asyncRoutesSetting);
}
function getRouterDirectoryModuleIdWithManifest(projectRoot, exp) {
    return exp.extra?.router?.root ?? getRouterDirectory(projectRoot);
}
function getRouterDirectory(projectRoot) {
    // more specific directories first
    if (directoryExistsSync(path_1.default.join(projectRoot, 'src', 'app'))) {
        debug('Using src/app as the root directory for Expo Router.');
        return path_1.default.join('src', 'app');
    }
    debug('Using app as the root directory for Expo Router.');
    return 'app';
}
function getRewriteRequestUrl(projectRoot) {
    function rewriteExpoRequestUrl(url) {
        // Like: `/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=com.bacon.test-custom-entry`
        // Sometimes a fully qualified URL is passed in, e.g. `http://localhost:19001/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=com.bacon.test-custom-entry`
        if (url.includes('/.expo/.virtual-metro-entry.bundle?')) {
            const { pkg, exp } = (0, config_1.getConfig)(projectRoot, { skipSDKVersionRequirement: true });
            const ensured = url.startsWith('/') ? new URL(url, 'https://acme.dev') : new URL(url);
            // TODO: Maybe this function could be memoized in some capacity?
            const { searchParams } = ensured;
            const isDev = searchParams.has('dev') ? searchParams.get('dev') === 'true' : true;
            const platform = searchParams.get('platform') ?? 'web';
            debug('Rewriting magic request url to entry point', { url, platform });
            const entry = (0, paths_1.resolveEntryPoint)(projectRoot, {
                platform,
                pkg,
            });
            if (!entry) {
                throw new Error((0, chalk_1.default) `The project entry file could not be resolved (platform: ${platform}, root: ${projectRoot}). Define it in the {bold package.json} "main" field.`);
            }
            // Infer the missing transform properties to attempt to match the manifest request.
            // NOTE: Keep in sync with metroOptions.ts
            if (!ensured.searchParams.has('transform.routerRoot')) {
                ensured.searchParams.set('transform.routerRoot', getRouterDirectoryModuleIdWithManifest(projectRoot, exp));
            }
            if (!ensured.searchParams.has('transform.reactCompiler') && exp.experiments?.reactCompiler) {
                ensured.searchParams.set('transform.reactCompiler', String(!!exp.experiments?.reactCompiler));
            }
            if (!ensured.searchParams.has('transform.asyncRoutes')) {
                const asyncRoutes = getAsyncRoutesFromExpoConfig(exp, isDev ? 'development' : 'production', platform);
                if (asyncRoutes) {
                    ensured.searchParams.set('transform.asyncRoutes', String(asyncRoutes));
                }
            }
            if (!ensured.searchParams.has('transform.engine')) {
                const isHermesEnabled = isEnableHermesManaged(exp, platform);
                if (isHermesEnabled) {
                    debug('Enabling Hermes for managed project');
                    ensured.searchParams.set('transform.engine', 'hermes');
                    ensured.searchParams.set('transform.bytecode', '1');
                    ensured.searchParams.set('unstable_transformProfile', 'hermes-stable');
                }
            }
            const serverRoot = (0, paths_1.getMetroServerRoot)(projectRoot);
            const relativeEntry = path_1.default.relative(serverRoot, entry).replace(/\.[tj]sx?$/, '');
            debug('Resolved entry point', { entry, relativeEntry, serverRoot });
            // Only return the pathname when url is relative
            if (url.startsWith('/')) {
                // Like: `/index.bundle?platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=com.bacon.test-custom-entry`
                return '/' + relativeEntry + '.bundle?' + searchParams.toString();
            }
            // Modify the pathname within the URL and return the full URL
            ensured.pathname = '/' + relativeEntry + '.bundle';
            const outputUrl = ensured.toString();
            debug('Redirected:', outputUrl);
            // Like: `http://localhost:19001/index.bundle?platform=ios&dev=true&minify=false&modulesOnly=false&runModule=true&app=com.bacon.test-custom-entry`
            return outputUrl;
        }
        return url;
    }
    return rewriteExpoRequestUrl;
}
//# sourceMappingURL=rewriteRequestUrl.js.map