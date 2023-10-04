"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIsDev = exports.getPlatform = exports.getBundler = exports.hasModule = void 0;
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
function getIsDev(caller) {
    if (caller?.isDev != null)
        return caller.isDev;
    return process.env.BABEL_ENV === 'development' || process.env.NODE_ENV === 'development';
}
exports.getIsDev = getIsDev;
