"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const plugins_1 = require("./plugins");
const utils_1 = require("./utils");
const withIosPlugin = (config, props) => {
    const pluginConfig = (0, utils_1.getPluginConfig)(props, config);
    config = (0, plugins_1.withXcodeProjectPlugin)(config, pluginConfig);
    config = (0, plugins_1.withPodfilePlugin)(config, pluginConfig);
    config = (0, plugins_1.withPodfilePropertiesPlugin)(config);
    config = (0, plugins_1.withBuildPropertiesPlugin)(config);
    return config;
};
exports.default = withIosPlugin;
