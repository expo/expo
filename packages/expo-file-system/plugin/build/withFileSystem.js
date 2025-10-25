"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("expo/config-plugins");
const pkg = require('expo-file-system/package.json');
const withFileSystem = (config, options = {}) => {
    const { supportsOpeningDocumentsInPlace = false, enableFileSharing = false } = options;
    // Apply Android permissions
    config = config_plugins_1.AndroidConfig.Permissions.withPermissions(config, [
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.INTERNET',
    ]);
    // Apply iOS modifications
    return (0, config_plugins_1.withInfoPlist)(config, (config) => {
        if (supportsOpeningDocumentsInPlace) {
            config.modResults.LSSupportsOpeningDocumentsInPlace = true;
        }
        if (enableFileSharing) {
            config.modResults.UIFileSharingEnabled = true;
        }
        return config;
    });
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withFileSystem, pkg.name, pkg.version);
