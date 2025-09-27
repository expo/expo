"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasModule = hasModule;
exports.getBundler = getBundler;
exports.getPlatform = getPlatform;
exports.getPossibleProjectRoot = getPossibleProjectRoot;
exports.getIsReactServer = getIsReactServer;
exports.getIsDev = getIsDev;
exports.getIsFastRefreshEnabled = getIsFastRefreshEnabled;
exports.getIsProd = getIsProd;
exports.getIsNodeModule = getIsNodeModule;
exports.getBaseUrl = getBaseUrl;
exports.getReactCompiler = getReactCompiler;
exports.getIsServer = getIsServer;
exports.getMetroSourceType = getMetroSourceType;
exports.getBabelRuntimeVersion = getBabelRuntimeVersion;
exports.getExpoRouterAbsoluteAppRoot = getExpoRouterAbsoluteAppRoot;
exports.getInlineEnvVarsEnabled = getInlineEnvVarsEnabled;
exports.getAsyncRoutes = getAsyncRoutes;
exports.createAddNamedImportOnce = createAddNamedImportOnce;
exports.toPosixPath = toPosixPath;
// @ts-expect-error: missing types
const helper_module_imports_1 = require("@babel/helper-module-imports");
const node_path_1 = __importDefault(require("node:path"));
function hasModule(name) {
    try {
        return !!require.resolve(name);
    }
    catch (error) {
        if (error.code === 'MODULE_NOT_FOUND' && error.message.includes(name)) {
            return false;
        }
        throw error;
    }
}
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
    return caller.platform;
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
    return !caller.isServer && !caller.isNodeModule && getIsDev(caller);
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
function getIsServer(caller) {
    assertExpoBabelCaller(caller);
    return caller?.isServer ?? false;
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
    if (node_path_1.default.isAbsolute(rootModuleId)) {
        return rootModuleId;
    }
    const projectRoot = getPossibleProjectRoot(caller) || '/';
    return node_path_1.default.join(projectRoot, rootModuleId);
}
function getInlineEnvVarsEnabled(caller) {
    assertExpoBabelCaller(caller);
    const isWebpack = getBundler(caller) === 'webpack';
    const isServer = getIsServer(caller);
    const isNodeModule = getIsNodeModule(caller);
    const preserveEnvVars = caller?.preserveEnvVars;
    // Development env vars are added using references to enable HMR in development.
    // Servers have env vars left as-is to read from the environment.
    return !isNodeModule && !isWebpack && !isServer && !preserveEnvVars;
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
