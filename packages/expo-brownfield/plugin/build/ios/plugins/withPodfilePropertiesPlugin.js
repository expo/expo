"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HOST_PROVIDED_FRAMEWORKS_KEY = void 0;
const config_plugins_1 = require("expo/config-plugins");
exports.HOST_PROVIDED_FRAMEWORKS_KEY = 'ios.brownfieldHostProvidedFrameworks';
const withPodfilePropertiesPlugin = (config, pluginConfig) => {
    return (0, config_plugins_1.withPodfileProperties)(config, (config) => {
        if (pluginConfig.buildReactNativeFromSource) {
            config.modResults['ios.useFrameworks'] = 'static';
        }
        // Bridges the plugin's `ios.hostProvidedFrameworks` declaration to the CLI: stored as a
        // JSON-stringified array since Podfile.properties.json values are conventionally strings
        // (so the Ruby Podfile side can read them uniformly via `podfile_properties[...]`).
        // Only written when non-empty to keep the file tidy for projects that don't need it.
        if (pluginConfig.hostProvidedFrameworks.length > 0) {
            config.modResults[exports.HOST_PROVIDED_FRAMEWORKS_KEY] = JSON.stringify(pluginConfig.hostProvidedFrameworks);
        }
        else {
            delete config.modResults[exports.HOST_PROVIDED_FRAMEWORKS_KEY];
        }
        return config;
    });
};
exports.default = withPodfilePropertiesPlugin;
