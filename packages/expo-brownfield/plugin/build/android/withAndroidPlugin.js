"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const plugins_1 = require("./plugins");
const utils_1 = require("./utils");
const withAndroidPlugin = (config, props) => {
    const pluginConfig = (0, utils_1.getPluginConfig)(props, config);
    config = (0, plugins_1.withProjectFilesPlugin)(config, pluginConfig);
    config = (0, plugins_1.withSettingsGradlePlugin)(config, pluginConfig);
    config = (0, plugins_1.withProjectBuildGradlePlugin)(config, pluginConfig);
    return config;
};
exports.default = withAndroidPlugin;
