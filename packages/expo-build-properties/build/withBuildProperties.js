"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withBuildProperties = void 0;
const android_1 = require("./android");
const ios_1 = require("./ios");
const pluginConfig_1 = require("./pluginConfig");
/**
 * Config plugin allowing customizing native Android and iOS build properties for managed apps.
 * @param config Expo config for application.
 * @param props Configuration for the build properties plugin.
 */
const withBuildProperties = (config, props) => {
    const pluginConfig = (0, pluginConfig_1.validateConfig)(props || {});
    config = (0, android_1.withAndroidBuildProperties)(config, pluginConfig);
    config = (0, android_1.withAndroidProguardRules)(config, pluginConfig);
    config = (0, android_1.withAndroidCleartextTraffic)(config, pluginConfig);
    config = (0, android_1.withAndroidQueries)(config, pluginConfig);
    // Assuming `withBuildProperties` could be called multiple times from different config-plugins,
    // the `withAndroidProguardRules` always appends new rules by default.
    // That is not ideal if we leave generated contents from previous prebuild there.
    // The `withAndroidPurgeProguardRulesOnce` is for this purpose and it would only run once in prebuilding phase.
    //
    // plugins order matter: the later one would run first
    config = (0, android_1.withAndroidPurgeProguardRulesOnce)(config);
    config = (0, android_1.withAndroidFlipper)(config, pluginConfig);
    config = (0, ios_1.withIosBuildProperties)(config, pluginConfig);
    config = (0, ios_1.withIosDeploymentTarget)(config, pluginConfig);
    return config;
};
exports.withBuildProperties = withBuildProperties;
exports.default = exports.withBuildProperties;
