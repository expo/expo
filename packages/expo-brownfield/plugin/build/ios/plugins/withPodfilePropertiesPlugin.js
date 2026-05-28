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
