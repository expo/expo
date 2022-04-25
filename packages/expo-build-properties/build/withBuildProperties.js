"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withBuildProperties = void 0;
const android_1 = require("./android");
const ios_1 = require("./ios");
const pluginConfig_1 = require("./pluginConfig");
/**
 * Config plugin to customize native Android or iOS build properties for managed apps
 * @param config ExpoConfig
 * @param props `PluginConfig` from app.json or app.config.js
 * @ignore
 */
const withBuildProperties = (config, props) => {
    const pluginConfig = (0, pluginConfig_1.validateConfig)(props || {});
    config = (0, android_1.withAndroidBuildProperties)(config, pluginConfig);
    config = (0, android_1.withAndroidProguardRules)(config, pluginConfig);
    config = (0, ios_1.withIosBuildProperties)(config, pluginConfig);
    config = (0, ios_1.withIosDeploymentTarget)(config, pluginConfig);
    return config;
};
exports.withBuildProperties = withBuildProperties;
exports.default = exports.withBuildProperties;
