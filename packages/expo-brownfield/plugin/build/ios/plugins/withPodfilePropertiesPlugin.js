"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const withPodfilePropertiesPlugin = (config, pluginConfig) => {
    return (0, config_plugins_1.withPodfileProperties)(config, (config) => {
        config.modResults['ios.useFrameworks'] = 'static';
        config.modResults['ios.brownfieldTargetName'] = pluginConfig.targetName;
        return config;
    });
};
exports.default = withPodfilePropertiesPlugin;
