"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
// Imported from the compiled output so the plugin/src rootDir is not extended.
const build_1 = require("../../../../shared/build");
const withPodfilePropertiesPlugin = (config, pluginConfig) => {
    return (0, config_plugins_1.withPodfileProperties)(config, (config) => {
        if (pluginConfig.buildReactNativeFromSource) {
            config.modResults['ios.useFrameworks'] = 'static';
        }
        if (pluginConfig.hostProvidedFrameworks.length > 0) {
            config.modResults[build_1.HOST_PROVIDED_FRAMEWORKS_KEY] = JSON.stringify(pluginConfig.hostProvidedFrameworks);
        }
        else {
            delete config.modResults[build_1.HOST_PROVIDED_FRAMEWORKS_KEY];
        }
        return config;
    });
};
exports.default = withPodfilePropertiesPlugin;
