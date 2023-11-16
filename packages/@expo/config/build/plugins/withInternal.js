"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withInternal = exports.EXPO_DEBUG = void 0;
const getenv_1 = require("getenv");
exports.EXPO_DEBUG = (0, getenv_1.boolish)('EXPO_DEBUG', false);
/**
 * Adds the _internal object.
 *
 * @param config
 * @param projectRoot
 */
const withInternal = (config, internals) => {
    if (!config._internal) {
        config._internal = {};
    }
    config._internal = {
        isDebug: exports.EXPO_DEBUG,
        ...config._internal,
        ...internals,
    };
    return config;
};
exports.withInternal = withInternal;
