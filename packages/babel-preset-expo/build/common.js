"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getInlineEnvVarsEnabled = exports.getIsServer = exports.getBaseUrl = exports.getIsProd = exports.getIsDev = exports.getPossibleProjectRoot = exports.getPlatform = exports.getBundler = exports.hasModule = void 0;
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
function getIsProd(caller) {
    if (caller?.isDev != null)
        return caller.isDev === false;
    // https://babeljs.io/docs/options#envname
    return process.env.BABEL_ENV === 'production' || process.env.NODE_ENV === 'production';
}
exports.getIsProd = getIsProd;
function getBaseUrl(caller) {
    return caller?.baseUrl ?? '';
}
exports.getBaseUrl = getBaseUrl;
function getIsServer(caller) {
    return caller?.isServer ?? false;
}
exports.getIsServer = getIsServer;
function getInlineEnvVarsEnabled(caller) {
    const isWebpack = getBundler(caller) === 'webpack';
    const isDev = getIsDev(caller);
    const isServer = getIsServer(caller);
    const preserveEnvVars = caller?.preserveEnvVars;
    // Development env vars are added in the serializer to avoid caching issues in development.
    // Servers have env vars left as-is to read from the environment.
    return !isWebpack && !isDev && !isServer && !preserveEnvVars;
}
exports.getInlineEnvVarsEnabled = getInlineEnvVarsEnabled;
