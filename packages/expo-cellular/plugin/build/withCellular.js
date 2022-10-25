"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('expo-cellular/package.json');
const withCellular = (config) => {
    config = config_plugins_1.AndroidConfig.Permissions.withPermissions(config, [
        // Required for TelephonyManager and `getNetworkType`
        'android.permission.READ_PHONE_STATE',
    ]);
    return config;
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withCellular, pkg.name, pkg.version);
