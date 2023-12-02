"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAsyncRoutes = exports.getInlineEnvVarsEnabled = exports.getExpoRouterAbsoluteAppRoot = exports.getIsServer = exports.getBaseUrl = exports.getIsNodeModule = exports.getIsProd = exports.getIsFastRefreshEnabled = exports.getIsDev = exports.getPossibleProjectRoot = exports.getPlatform = exports.getBundler = exports.hasModule = void 0;
const path_1 = __importDefault(require("path"));
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
exports.hasModule = hasModule;
/** Determine which bundler is being used. */
function getBundler(caller) {
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
exports.getBundler = getBundler;
function getPlatform(caller) {
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
exports.getPlatform = getPlatform;
function getPossibleProjectRoot(caller) {
    if (!caller)
        return null;
    if (caller.projectRoot)
        return caller.projectRoot;
    // unknown
    return process.env.EXPO_PROJECT_ROOT;
}
exports.getPossibleProjectRoot = getPossibleProjectRoot;
function getIsDev(caller) {
    if (caller?.isDev != null)
        return caller.isDev;
    // https://babeljs.io/docs/options#envname
    return process.env.BABEL_ENV === 'development' || process.env.NODE_ENV === 'development';
}
exports.getIsDev = getIsDev;
function getIsFastRefreshEnabled(caller) {
    if (!caller)
        return false;
    return caller.isHMREnabled && !caller.isServer && !caller.isNodeModule && getIsDev(caller);
}
exports.getIsFastRefreshEnabled = getIsFastRefreshEnabled;
function getIsProd(caller) {
    if (caller?.isDev != null)
        return caller.isDev === false;
    // https://babeljs.io/docs/options#envname
    return process.env.BABEL_ENV === 'production' || process.env.NODE_ENV === 'production';
}
exports.getIsProd = getIsProd;
function getIsNodeModule(caller) {
    return caller?.isNodeModule ?? false;
}
exports.getIsNodeModule = getIsNodeModule;
function getBaseUrl(caller) {
    return caller?.baseUrl ?? '';
}
exports.getBaseUrl = getBaseUrl;
function getIsServer(caller) {
    return caller?.isServer ?? false;
}
exports.getIsServer = getIsServer;
function getExpoRouterAbsoluteAppRoot(caller) {
    const rootModuleId = caller?.routerRoot ?? './app';
    if (path_1.default.isAbsolute(rootModuleId)) {
        return rootModuleId;
    }
    const projectRoot = getPossibleProjectRoot(caller) || '/';
    return path_1.default.join(projectRoot, rootModuleId);
}
exports.getExpoRouterAbsoluteAppRoot = getExpoRouterAbsoluteAppRoot;
function getInlineEnvVarsEnabled(caller) {
    const isWebpack = getBundler(caller) === 'webpack';
    const isDev = getIsDev(caller);
    const isServer = getIsServer(caller);
    const isNodeModule = getIsNodeModule(caller);
    const preserveEnvVars = caller?.preserveEnvVars;
    // Development env vars are added in the serializer to avoid caching issues in development.
    // Servers have env vars left as-is to read from the environment.
    return !isNodeModule && !isWebpack && !isDev && !isServer && !preserveEnvVars;
}
exports.getInlineEnvVarsEnabled = getInlineEnvVarsEnabled;
function getAsyncRoutes(caller) {
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
exports.getAsyncRoutes = getAsyncRoutes;
