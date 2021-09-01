"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const pkg = require('expo-file-system/package.json');
const withFileSystem = (config) => {
    return config_plugins_1.AndroidConfig.Permissions.withPermissions(config, [
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.INTERNET',
    ]);
};
exports.default = config_plugins_1.createRunOncePlugin(withFileSystem, pkg.name, pkg.version);
