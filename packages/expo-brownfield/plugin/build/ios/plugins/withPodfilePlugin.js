"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const utils_1 = require("../utils");
const withPodfilePlugin = (config, pluginConfig) => {
    return (0, config_plugins_1.withPodfile)(config, (config) => {
        config.modResults.contents = (0, utils_1.addCustomRubyScriptImport)(config.modResults.contents, pluginConfig.targetName);
        config.modResults.contents = (0, utils_1.addNewPodsTarget)(config.modResults.contents, pluginConfig.targetName);
        return config;
    });
};
exports.default = withPodfilePlugin;
