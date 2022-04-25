"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const android_1 = require("./android");
const ios_1 = require("./ios");
const pluginConfig_1 = require("./pluginConfig");
const pkg = require('expo-build-properties/package.json');
/**
 * Config plugin to customize native Android or iOS build properties for managed apps
 */
const withBuildProperties = (config, props) => {
    const pluginConfig = (0, pluginConfig_1.validateConfig)(props || {});
    config = (0, android_1.withAndroidBuildProperties)(config, pluginConfig);
    config = (0, android_1.withAndroidProguardRules)(config, pluginConfig);
    config = (0, ios_1.withIosBuildProperties)(config, pluginConfig);
    config = (0, ios_1.withIosDeploymentTarget)(config, pluginConfig);
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withBuildProperties, pkg.name, pkg.version);
