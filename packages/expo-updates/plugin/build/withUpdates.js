"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@expo/config");
const config_plugins_1 = require("@expo/config-plugins");
const pkg = require('expo-updates/package.json');
const withUpdates = (config, props = {}) => {
    var _a;
    // The username will be passed from the CLI when the plugin is automatically used.
    const expoUsername = (_a = (props || {}).expoUsername) !== null && _a !== void 0 ? _a : (0, config_1.getAccountUsername)(config);
    config = config_plugins_1.AndroidConfig.Updates.withUpdates(config, { expoUsername });
    config = config_plugins_1.IOSConfig.Updates.withUpdates(config, { expoUsername });
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withUpdates, pkg.name, pkg.version);
