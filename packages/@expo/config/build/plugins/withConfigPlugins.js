"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withConfigPlugins = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const Serialize_1 = require("../Serialize");
/**
 * Resolves static plugins array as config plugin functions.
 *
 * @param config
 * @param projectRoot
 */
const withConfigPlugins = (config, skipPlugins) => {
    // @ts-ignore: plugins not on config type yet -- TODO
    if (!Array.isArray(config.plugins) || !config.plugins?.length) {
        return config;
    }
    if (!skipPlugins) {
        // Resolve and evaluate plugins
        // @ts-ignore: TODO: add plugins to the config schema
        config = (0, config_plugins_1.withPlugins)(config, config.plugins);
    }
    else {
        // Delete the plugins array in case someone added functions or other values which cannot be automatically serialized.
        delete config.plugins;
    }
    // plugins aren't serialized by default, serialize the plugins after resolving them.
    return (0, Serialize_1.serializeAfterStaticPlugins)(config);
};
exports.withConfigPlugins = withConfigPlugins;
