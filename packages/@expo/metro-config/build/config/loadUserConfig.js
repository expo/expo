"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadUserConfig = loadUserConfig;
const metro_config_1 = require("@expo/metro/metro-config");
const ExpoMetroConfig_1 = require("../ExpoMetroConfig");
const resolveMetroUserConfig_1 = require("./resolveMetroUserConfig");
const loadBabelConfig_1 = require("../loadBabelConfig");
function asWritable(input) {
    return input;
}
/** Resolves a user Metro config from the given `params.projectRoot` */
async function loadUserConfig(params) {
    const defaultConfig = (0, ExpoMetroConfig_1.getDefaultConfig)(params.projectRoot);
    const resolvedConfig = await (0, resolveMetroUserConfig_1.resolveMetroUserConfig)(params);
    let config = resolvedConfig.isEmpty
        ? defaultConfig
        : await (0, metro_config_1.mergeConfig)(defaultConfig, resolvedConfig.config);
    config = {
        ...config,
        // Set the watchFolders to include the projectRoot, as Metro assumes this
        watchFolders: !config.watchFolders.includes(config.projectRoot)
            ? [config.projectRoot, ...config.watchFolders]
            : config.watchFolders,
    };
    // NOTE(@kitten): Pass a hint to the transformer on where to find the Babel config
    asWritable(config.transformer).extendsBabelConfigPath =
        config.transformer.enableBabelRCLookup !== false
            ? (0, loadBabelConfig_1.resolveBabelrcName)(params.projectRoot)
            : undefined;
    // NOTE(@kitten): `useWatchman` is currently enabled by default, but it also disables `forceNodeFilesystemAPI`.
    // If we instead set it to the special value `null`, it gets enables but also bypasses the "native find" codepath,
    // which is slower than just using the Node filesystem API
    // See: https://github.com/facebook/metro/blob/b9c243f/packages/metro-file-map/src/index.js#L326
    // See: https://github.com/facebook/metro/blob/b9c243f/packages/metro/src/node-haste/DependencyGraph/createFileMap.js#L109
    if (config.resolver.useWatchman === true) {
        asWritable(config.resolver).useWatchman = null;
    }
    return config;
}
//# sourceMappingURL=loadUserConfig.js.map