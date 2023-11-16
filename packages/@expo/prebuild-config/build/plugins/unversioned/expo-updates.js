"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withExpoUpdates = void 0;
const config_plugins_1 = require("@expo/config-plugins");
// Local unversioned updates plugin
const packageName = 'expo-updates';
const withExpoUpdates = (config) => {
    return (0, config_plugins_1.withStaticPlugin)(config, {
        _isLegacyPlugin: true,
        // Pass props to the static plugin if it exists.
        plugin: packageName,
        // If the static plugin isn't found, use the unversioned one.
        fallback: (0, config_plugins_1.createRunOncePlugin)((config) => withUnversionedUpdates(config), packageName),
    });
};
exports.withExpoUpdates = withExpoUpdates;
const withUnversionedUpdates = (config) => {
    config = config_plugins_1.AndroidConfig.Updates.withUpdates(config);
    config = config_plugins_1.IOSConfig.Updates.withUpdates(config);
    return config;
};
exports.default = exports.withExpoUpdates;
