"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('expo-brightness/package.json');
const withBrightness = (config) => {
    return config_plugins_1.AndroidConfig.Permissions.withPermissions(config, ['android.permission.WRITE_SETTINGS']);
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withBrightness, pkg.name, pkg.version);
