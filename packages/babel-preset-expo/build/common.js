"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBundler = getBundler;
exports.getPlatform = getPlatform;
exports.getEngine = getEngine;
exports.getPossibleProjectRoot = getPossibleProjectRoot;
exports.getIsReactServer = getIsReactServer;
exports.getIsDev = getIsDev;
exports.getIsFastRefreshEnabled = getIsFastRefreshEnabled;
exports.getIsProd = getIsProd;
exports.getIsNodeModule = getIsNodeModule;
exports.getBaseUrl = getBaseUrl;
exports.getReactCompiler = getReactCompiler;
exports.getStaticESM = getStaticESM;
exports.getIsServer = getIsServer;
exports.getIsDomComponent = getIsDomComponent;
exports.getIsLoaderBundle = getIsLoaderBundle;
exports.getMetroSourceType = getMetroSourceType;
exports.getBabelRuntimeVersion = getBabelRuntimeVersion;
exports.getExpoRouterAbsoluteAppRoot = getExpoRouterAbsoluteAppRoot;
exports.getInlineEnvVarsEnabled = getInlineEnvVarsEnabled;
exports.getNodeModuleInlineEnvVarsEnabled = getNodeModuleInlineEnvVarsEnabled;
exports.getNodeModulePackageName = getNodeModulePackageName;
exports.matchesPackage = matchesPackage;
exports.getAsyncRoutes = getAsyncRoutes;
exports.createAddNamedImportOnce = createAddNamedImportOnce;
exports.toPosixPath = toPosixPath;
// @ts-expect-error: missing types
const helper_module_imports_1 = require("@babel/helper-module-imports");
const node_path_1 = __importDefault(require("node:path"));
/** Determine which bundler is being used. */
function getBundler(caller) {
    assertExpoBabelCaller(caller);
    if (!caller)
        return null;
    if (caller.bundler)
        return caller.bundler;
    if (
    // Known tools that use `webpack`-mode via `babel-loader`: `@expo/webpack-config`, Next.js <10
    caller.name === 'babel-loader' ||
        // NextJS 11 uses this custom caller name.
        caller.name === 'next-babel-turbo-loader') {
        return 'webpack';
    }
    // Assume anything else is Metro.
    return 'metro';
}
function getPlatform(caller) {
    assertExpoBabelCaller(caller);
    if (!caller)
        return null;
    if (caller.platform)
        return caller.platform;
    const bundler = getBundler(caller);
    if (bundler === 'webpack') {
        return 'web';
    }
    // unknown
    return caller.platform ?? null;
}
function getEngine(caller) {
    assertExpoBabelCaller(caller);
    return caller?.engine ?? 'default';
}
function getPossibleProjectRoot(caller) {
    assertExpoBabelCaller(caller);
    if (!caller)
        return null;
    if (caller.projectRoot)
        return caller.projectRoot;
    // unknown
    return process.env.EXPO_PROJECT_ROOT;
}
/** If bundling for a react-server target. */
function getIsReactServer(caller) {
    assertExpoBabelCaller(caller);
    return caller?.isReactServer ?? false;
}
function assertExpoBabelCaller(caller) { }
function getIsDev(caller) {
    assertExpoBabelCaller(caller);
    if (caller?.isDev != null)
        return caller.isDev;
    // https://babeljs.io/docs/options#envname
    return process.env.BABEL_ENV === 'development' || process.env.NODE_ENV === 'development';
}
function getIsFastRefreshEnabled(caller) {
    assertExpoBabelCaller(caller);
    if (!caller)
        return false;
    // NOTE(@kitten): `isHMREnabled` is always true in `@expo/metro-config`.
    // However, we still use this option to ensure fast refresh is only enabled in supported runtimes (Metro + Expo)
    return !!caller.isHMREnabled && !caller.isServer && !caller.isNodeModule && getIsDev(caller);
}
function getIsProd(caller) {
    assertExpoBabelCaller(caller);
    if (caller?.isDev != null)
        return caller.isDev === false;
    // https://babeljs.io/docs/options#envname
    return process.env.BABEL_ENV === 'production' || process.env.NODE_ENV === 'production';
}
function getIsNodeModule(caller) {
    return caller?.isNodeModule ?? false;
}
function getBaseUrl(caller) {
    assertExpoBabelCaller(caller);
    return caller?.baseUrl ?? '';
}
function getReactCompiler(caller) {
    assertExpoBabelCaller(caller);
    return caller?.supportsReactCompiler ?? false;
}
function getStaticESM(caller) {
    assertExpoBabelCaller(caller);
    return caller?.supportsStaticESM;
}
function getIsServer(caller) {
    assertExpoBabelCaller(caller);
    return caller?.isServer ?? false;
}
function getIsDomComponent(caller) {
    assertExpoBabelCaller(caller);
    return caller?.isDomComponent ?? false;
}
function getIsLoaderBundle(caller) {
    assertExpoBabelCaller(caller);
    return caller?.isLoaderBundle ?? false;
}
function getMetroSourceType(caller) {
    assertExpoBabelCaller(caller);
    return caller?.metroSourceType;
}
function getBabelRuntimeVersion(caller) {
    assertExpoBabelCaller(caller);
    let babelRuntimeVersion;
    if (typeof caller?.babelRuntimeVersion === 'string') {
        babelRuntimeVersion = caller.babelRuntimeVersion;
    }
    else {
        try {
            babelRuntimeVersion = require('@babel/runtime/package.json').version;
        }
        catch (error) {
            if (error.code !== 'MODULE_NOT_FOUND')
                throw error;
        }
    }
    // NOTE(@kitten): The default shouldn't be higher than `expo/package.json`'s `@babel/runtime` version
    // or `babel-preset-expo/package.json`'s peer dependency range for `@babel/runtime`
    return babelRuntimeVersion ?? '^7.20.0';
}
function getExpoRouterAbsoluteAppRoot(caller) {
    assertExpoBabelCaller(caller);
    const rootModuleId = caller?.routerRoot ?? './app';
    const projectRoot = getPossibleProjectRoot(caller);
    const resolved = node_path_1.default.isAbsolute(rootModuleId)
        ? rootModuleId
        : node_path_1.default.join(projectRoot || '/', rootModuleId);
    // Silently fall back to the default if the configured router root escapes the project root, as a safety net
    if (projectRoot && !isPathInside(resolved, projectRoot)) {
        return node_path_1.default.join(projectRoot, 'app');
    }
    return resolved;
}
function isPathInside(child, parent) {
    const relative = node_path_1.default.relative(parent, child);
    return !!relative && !relative.startsWith('..') && !node_path_1.default.isAbsolute(relative);
}
// Conditions that disable `EXPO_PUBLIC_*` inlining regardless of where the code lives.
function isInlineEnvVarsDisabled(caller) {
    const isWebpack = getBundler(caller) === 'webpack';
    const isServer = getIsServer(caller);
    const preserveEnvVars = caller?.preserveEnvVars;
    return isWebpack || isServer || !!preserveEnvVars;
}
function getInlineEnvVarsEnabled(caller) {
    assertExpoBabelCaller(caller);
    const isNodeModule = getIsNodeModule(caller);
    // Development env vars are added using references to enable HMR in development.
    // Servers have env vars left as-is to read from the environment.
    return !isNodeModule && !isInlineEnvVarsDisabled(caller);
}
function getNodeModuleInlineEnvVarsEnabled(caller) {
    assertExpoBabelCaller(caller);
    const isNodeModule = getIsNodeModule(caller);
    const isProd = getIsProd(caller);
    // node_modules: production only — dev is handled by the `@expo/metro-config` serializer's global
    // `process.env`. The per-package allowlist is applied per file by the inline-env-vars plugin.
    return isNodeModule && isProd && !isInlineEnvVarsDisabled(caller);
}
/**
 * Extract the owning `node_modules` package name from a file path, e.g. `expo`, `@expo/metro-config`,
 * or `@acme/shared`. Uses the LAST `node_modules` segment so nested and pnpm-style layouts
 * (`.../node_modules/.pnpm/expo@x/node_modules/expo/...`) resolve to the innermost package. Matching
 * whole path segments avoids false positives like a `my_node_modules` directory. Returns undefined
 * when the path is not inside `node_modules` (app code).
 */
function getNodeModulePackageName(filename) {
    const segments = filename.split(/[\\/]/);
    const i = segments.lastIndexOf('node_modules');
    if (i === -1)
        return undefined;
    const scopeOrName = segments[i + 1];
    if (!scopeOrName)
        return undefined;
    if (scopeOrName.startsWith('@')) {
        const name = segments[i + 2];
        return name ? `${scopeOrName}/${name}` : undefined;
    }
    return scopeOrName;
}
/**
 * Whether `pkg` is covered by `allowlist`. Entries match by exact package name; a trailing `/*`
 * matches a whole scope, e.g. `'@acme/*'` matches `@acme/shared` and `@acme/utils`. A bare name
 * like `'expo'` matches only `expo`, never `expo-router`.
 */
function matchesPackage(pkg, allowlist) {
    return allowlist.some((entry) => entry.endsWith('/*') ? pkg.startsWith(entry.slice(0, -1)) : pkg === entry);
}
function getAsyncRoutes(caller) {
    assertExpoBabelCaller(caller);
    const isServer = getIsServer(caller);
    if (isServer) {
        return false;
    }
    const isProd = getIsProd(caller);
    const platform = getPlatform(caller);
    if (platform !== 'web' && isProd) {
        return false;
    }
    return caller?.asyncRoutes ?? false;
}
const getOrCreateInMap = (map, key, create) => {
    if (!map.has(key)) {
        const result = create();
        map.set(key, result);
        return [result, true];
    }
    return [map.get(key), false];
};
function createAddNamedImportOnce(t) {
    const addedImportsCache = new Map();
    return function addNamedImportOnce(path, name, source) {
        const [sourceCache] = getOrCreateInMap(addedImportsCache, source, () => new Map());
        const [identifier, didCreate] = getOrCreateInMap(sourceCache, name, () => (0, helper_module_imports_1.addNamed)(path, name, source));
        // for cached imports, we need to clone the resulting identifier, because otherwise
        // '@babel/plugin-transform-modules-commonjs' won't replace the references to the import for some reason.
        // this is a helper for that.
        return didCreate ? identifier : t.cloneNode(identifier);
    };
}
const REGEXP_REPLACE_SLASHES = /\\/g;
/**
 * Convert any platform-specific path to a POSIX path.
 */
function toPosixPath(filePath) {
    return filePath.replace(REGEXP_REPLACE_SLASHES, '/');
}
//# sourceMappingURL=common.js.map