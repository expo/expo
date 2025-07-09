"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('expo-updates/package.json');
// when making changes to this config plugin, ensure the same changes are also made in eas-cli and build-tools
const withUpdates = (config) => {
    config = config_plugins_1.AndroidConfig.Updates.withUpdates(config);
    config = config_plugins_1.IOSConfig.Updates.withUpdates(config);
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withUpdates, pkg.name, pkg.version);
